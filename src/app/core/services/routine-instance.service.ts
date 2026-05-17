import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, of, switchMap, tap, map } from 'rxjs';
import {
  RoutineInstance,
  RoutineInstanceStatus,
  RoutineStreak,
  Task,
  TaskCompletion,
} from '../../models/routine.model';
import { ROUTINE_INSTANCE_REPOSITORY_TOKEN } from '../interfaces/routine-instance-repository.interface';
import { TASK_COMPLETION_REPOSITORY_TOKEN } from '../interfaces/task-completion-repository.interface';
import { ROUTINE_STREAK_REPOSITORY_TOKEN } from '../interfaces/routine-streak-repository.interface';
import { ROUTINE_REPOSITORY_TOKEN } from '../interfaces/routine-repository.interface';
import { formatLocalDate, parseLocalDate } from '../utils/routine-schedule.utils';
import { RoutineService } from './routine.service';

@Injectable({ providedIn: 'root' })
export class RoutineInstanceService {
  private readonly instanceRepo = inject(ROUTINE_INSTANCE_REPOSITORY_TOKEN);
  private readonly completionRepo = inject(TASK_COMPLETION_REPOSITORY_TOKEN);
  private readonly streakRepo = inject(ROUTINE_STREAK_REPOSITORY_TOKEN);
  private readonly routineRepo = inject(ROUTINE_REPOSITORY_TOKEN);
  private readonly routineService = inject(RoutineService);

  private readonly _instances = signal<RoutineInstance[]>([]);
  private readonly _completions = signal<TaskCompletion[]>([]);
  private readonly _loading = signal(false);

  readonly instances = this._instances.asReadonly();
  readonly completions = this._completions.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly todayInstances = computed(() => {
    const today = formatLocalDate(new Date());
    return this._instances().filter(i => i.date === today);
  });

  loadAll(): void {
    this._loading.set(true);
    this.instanceRepo.getAll().subscribe({
      next: list => {
        this._instances.set(list);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
    this.completionRepo.getAll().subscribe({ next: list => this._completions.set(list) });
  }

  getOrCreateForDate(routineId: string, date: Date | string): Observable<RoutineInstance> {
    const dateStr = typeof date === 'string' ? date : formatLocalDate(date);
    return this.instanceRepo.getOrCreateForDate(routineId, dateStr).pipe(
      tap(instance => this.upsertInstance(instance)),
    );
  }

  toggleTaskCompletion(
    instanceId: string,
    taskId: string,
    note?: string,
  ): Observable<{ instance: RoutineInstance; completed: boolean }> {
    const existing = this._completions().find(
      c => c.routineInstanceId === instanceId && c.taskId === taskId,
    );
    if (existing) {
      return this.completionRepo.removeByInstanceAndTask(instanceId, taskId).pipe(
        tap(() => this._completions.update(list => list.filter(c => c.id !== existing.id))),
        switchMap(() => this.recomputeAfterToggle(instanceId, false)),
      );
    }
    return this.completionRepo
      .add({ routineInstanceId: instanceId, taskId, note, completedAt: new Date() })
      .pipe(
        tap(c => this._completions.update(list => [...list, c])),
        switchMap(() => this.recomputeAfterToggle(instanceId, true)),
      );
  }

  complete(instanceId: string): Observable<RoutineInstance> {
    return this.instanceRepo.updateStatus(instanceId, RoutineInstanceStatus.COMPLETED).pipe(
      tap(i => this.upsertInstance(i)),
      switchMap(i =>
        this.instanceRepo.markClosed(instanceId).pipe(
          tap(closed => this.upsertInstance(closed)),
          switchMap(closed => this.bumpStreakOnComplete(closed).pipe(map(() => closed))),
        ),
      ),
    );
  }

  skip(instanceId: string): Observable<RoutineInstance> {
    return this.instanceRepo.updateStatus(instanceId, RoutineInstanceStatus.SKIPPED).pipe(
      tap(i => this.upsertInstance(i)),
      switchMap(i =>
        this.instanceRepo.markClosed(instanceId).pipe(tap(closed => this.upsertInstance(closed))),
      ),
    );
  }

  reopen(instanceId: string): Observable<RoutineInstance> {
    return this.instanceRepo.updateStatus(instanceId, RoutineInstanceStatus.IN_PROGRESS).pipe(
      tap(i => this.upsertInstance(i)),
    );
  }

  getCompletionsForInstance(instanceId: string): TaskCompletion[] {
    return this._completions().filter(c => c.routineInstanceId === instanceId);
  }

  isTaskCompleted(instanceId: string, taskId: string): boolean {
    return this._completions().some(
      c => c.routineInstanceId === instanceId && c.taskId === taskId,
    );
  }

  private recomputeAfterToggle(
    instanceId: string,
    completed: boolean,
  ): Observable<{ instance: RoutineInstance; completed: boolean }> {
    return this.routineRepo.getAllTasks().pipe(
      switchMap(allTasks => {
        const instance = this._instances().find(i => i.id === instanceId);
        if (!instance) {
          return this.instanceRepo.getById(instanceId).pipe(
            switchMap(found => {
              if (!found) throw new Error('Instance not found');
              return this.applyScoreAndStatus(found, allTasks, completed);
            }),
          );
        }
        return this.applyScoreAndStatus(instance, allTasks, completed);
      }),
    );
  }

  private applyScoreAndStatus(
    instance: RoutineInstance,
    allTasks: Task[],
    completed: boolean,
  ): Observable<{ instance: RoutineInstance; completed: boolean }> {
    const tasks = allTasks.filter(t => t.routineId === instance.routineId);
    const total = tasks.length;
    const done = this._completions().filter(c => c.routineInstanceId === instance.id).length;
    const score = total === 0 ? 0 : Math.round((done / total) * 100);

    const nextStatus =
      total === 0
        ? instance.status
        : done === 0
          ? RoutineInstanceStatus.PENDING
          : done >= total
            ? RoutineInstanceStatus.COMPLETED
            : RoutineInstanceStatus.IN_PROGRESS;

    const ops: Observable<RoutineInstance>[] = [];
    if (instance.completionScore !== score) {
      ops.push(this.instanceRepo.updateScore(instance.id, score));
    }
    if (instance.status !== nextStatus) {
      ops.push(this.instanceRepo.updateStatus(instance.id, nextStatus));
    }
    if (!instance.openedAt && done > 0) {
      ops.push(this.instanceRepo.markOpened(instance.id));
    }
    if (nextStatus === RoutineInstanceStatus.COMPLETED && !instance.closedAt) {
      ops.push(this.instanceRepo.markClosed(instance.id));
    }

    const apply: Observable<RoutineInstance> = ops.length === 0
      ? of(instance)
      : forkJoin(ops).pipe(map(updates => updates[updates.length - 1]));

    return apply.pipe(
      tap(updated => this.upsertInstance(updated)),
      switchMap(updated =>
        nextStatus === RoutineInstanceStatus.COMPLETED && instance.status !== RoutineInstanceStatus.COMPLETED
          ? this.bumpStreakOnComplete(updated).pipe(map(() => updated))
          : of(updated),
      ),
      map(updated => ({ instance: updated, completed })),
    );
  }

  private bumpStreakOnComplete(instance: RoutineInstance): Observable<RoutineStreak> {
    const current = this.routineService.getStreak(instance.routineId);
    const completedDate = parseLocalDate(instance.date);
    const last = current.lastCompletedDate ? new Date(current.lastCompletedDate) : null;
    const dayDiff = last ? this.daysBetween(last, completedDate) : null;

    let nextCurrent = current.currentStreak;
    if (dayDiff === null || dayDiff > 1) nextCurrent = 1;
    else if (dayDiff === 1) nextCurrent = current.currentStreak + 1;
    // dayDiff === 0 → same day, no change

    const nextLongest = Math.max(current.longestStreak, nextCurrent);
    const celebrationPending = nextCurrent > 0 && nextCurrent % 7 === 0
      ? true
      : current.celebrationPending;

    const next: RoutineStreak = {
      routineId: instance.routineId,
      userId: current.userId || 'local-user',
      currentStreak: nextCurrent,
      longestStreak: nextLongest,
      lastCompletedDate: completedDate,
      celebrationPending,
    };

    return this.streakRepo.upsert(next).pipe(
      tap(updated => this.routineService.upsertStreak(updated)),
    );
  }

  private daysBetween(a: Date, b: Date): number {
    const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
    return Math.round((db - da) / (1000 * 60 * 60 * 24));
  }

  private upsertInstance(instance: RoutineInstance): void {
    this._instances.update(list => {
      const idx = list.findIndex(i => i.id === instance.id);
      if (idx === -1) return [...list, instance];
      const next = [...list];
      next[idx] = instance;
      return next;
    });
  }
}
