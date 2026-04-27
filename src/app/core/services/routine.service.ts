import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  Routine,
  RoutineCreateRequest,
  RoutineUpdateRequest,
  RoutineFilters,
  RoutineWithStats,
  RoutineStreak,
  Task,
  TaskCreateRequest,
  TaskUpdateRequest,
} from '../../models/routine.model';
import { ROUTINE_REPOSITORY_TOKEN } from '../interfaces/routine-repository.interface';
import { ROUTINE_STREAK_REPOSITORY_TOKEN } from '../interfaces/routine-streak-repository.interface';
import { ROUTINE_INSTANCE_REPOSITORY_TOKEN } from '../interfaces/routine-instance-repository.interface';
import { isRoutineScheduledForDate, formatLocalDate } from '../utils/routine-schedule.utils';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class RoutineService {
  private readonly routineRepo = inject(ROUTINE_REPOSITORY_TOKEN);
  private readonly streakRepo = inject(ROUTINE_STREAK_REPOSITORY_TOKEN);
  private readonly instanceRepo = inject(ROUTINE_INSTANCE_REPOSITORY_TOKEN);
  private readonly notifications = inject(NotificationService);

  private readonly _routines = signal<Routine[]>([]);
  private readonly _tasks = signal<Task[]>([]);
  private readonly _streaks = signal<RoutineStreak[]>([]);
  private readonly _filters = signal<RoutineFilters>({});
  private readonly _loading = signal(false);

  readonly routines = this._routines.asReadonly();
  readonly tasks = this._tasks.asReadonly();
  readonly streaks = this._streaks.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly activeRoutines = computed(() => this._routines().filter(r => r.active));

  readonly todayRoutines = computed(() => {
    const today = new Date();
    return this.activeRoutines().filter(r => isRoutineScheduledForDate(r.scheduleConfig, today));
  });

  readonly filteredRoutines = computed(() => {
    const list = this._routines();
    return this.applyFilters(list, this._filters());
  });

  readonly routinesWithStats = computed<RoutineWithStats[]>(() => {
    const tasks = this._tasks();
    const streaks = this._streaks();
    return this._routines().map(routine => ({
      ...routine,
      tasks: tasks.filter(t => t.routineId === routine.id).sort((a, b) => a.order - b.order),
      streak: streaks.find(s => s.routineId === routine.id) ?? this.emptyStreak(routine.id),
      completionRate: 0,
    }));
  });

  loadAll(): void {
    this._loading.set(true);
    this.routineRepo.getAll().subscribe({
      next: routines => {
        this._routines.set(routines);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
    this.routineRepo.getAllTasks().subscribe({ next: tasks => this._tasks.set(tasks) });
    this.streakRepo.getAll().subscribe({ next: streaks => this._streaks.set(streaks) });
  }

  create(request: RoutineCreateRequest): Observable<Routine> {
    this._loading.set(true);
    return this.routineRepo.create(request).pipe(
      tap({
        next: routine => {
          this._routines.update(list => [...list, routine]);
          this._loading.set(false);
          this.routineRepo.getTasks(routine.id).subscribe({
            next: tasks => this._tasks.update(list => [...list.filter(t => t.routineId !== routine.id), ...tasks]),
          });
          this.notifications.success('Rutina creada', `"${routine.name}" lista para comenzar`);
        },
        error: () => this._loading.set(false),
      }),
    );
  }

  update(id: string, request: RoutineUpdateRequest): Observable<Routine> {
    return this.routineRepo.update(id, request).pipe(
      tap(updated => {
        this._routines.update(list => list.map(r => (r.id === id ? updated : r)));
        this.notifications.success('Rutina actualizada');
      }),
    );
  }

  archive(id: string): Observable<Routine> {
    return this.update(id, { active: false });
  }

  unarchive(id: string): Observable<Routine> {
    return this.update(id, { active: true });
  }

  delete(id: string): Observable<boolean> {
    return this.routineRepo.delete(id).pipe(
      tap(() => {
        this._routines.update(list => list.filter(r => r.id !== id));
        this._tasks.update(list => list.filter(t => t.routineId !== id));
        this._streaks.update(list => list.filter(s => s.routineId !== id));
        this.notifications.info('Rutina eliminada');
      }),
    );
  }

  addTask(routineId: string, request: TaskCreateRequest): Observable<Task> {
    return this.routineRepo.addTask(routineId, request).pipe(
      tap(task => this._tasks.update(list => [...list, task])),
    );
  }

  updateTask(taskId: string, request: TaskUpdateRequest): Observable<Task> {
    return this.routineRepo.updateTask(taskId, request).pipe(
      tap(task => this._tasks.update(list => list.map(t => (t.id === taskId ? task : t)))),
    );
  }

  deleteTask(taskId: string): Observable<boolean> {
    return this.routineRepo.deleteTask(taskId).pipe(
      tap(() => this._tasks.update(list => list.filter(t => t.id !== taskId))),
    );
  }

  reorderTasks(routineId: string, orderedIds: string[]): Observable<Task[]> {
    return this.routineRepo.reorderTasks(routineId, orderedIds).pipe(
      tap(reordered => {
        this._tasks.update(list => {
          const others = list.filter(t => t.routineId !== routineId);
          return [...others, ...reordered];
        });
      }),
    );
  }

  ensureInstanceForToday(routineId: string): Observable<unknown> {
    const today = formatLocalDate(new Date());
    return this.instanceRepo.getOrCreateForDate(routineId, today);
  }

  setFilters(filters: RoutineFilters): void {
    this._filters.set(filters);
  }

  clearFilters(): void {
    this._filters.set({});
  }

  getRoutineTasks(routineId: string): Task[] {
    return this._tasks()
      .filter(t => t.routineId === routineId)
      .sort((a, b) => a.order - b.order);
  }

  getStreak(routineId: string): RoutineStreak {
    return this._streaks().find(s => s.routineId === routineId) ?? this.emptyStreak(routineId);
  }

  upsertStreak(streak: RoutineStreak): void {
    this._streaks.update(list => {
      const idx = list.findIndex(s => s.routineId === streak.routineId);
      if (idx === -1) return [...list, streak];
      const next = [...list];
      next[idx] = streak;
      return next;
    });
  }

  private applyFilters(list: Routine[], filters: RoutineFilters): Routine[] {
    return list.filter(r => {
      if (filters.active !== undefined && r.active !== filters.active) return false;
      if (filters.scheduleType && r.scheduleType !== filters.scheduleType) return false;
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matchName = r.name.toLowerCase().includes(search);
        const matchDesc = r.description?.toLowerCase().includes(search);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }

  private emptyStreak(routineId: string): RoutineStreak {
    return {
      routineId,
      userId: 'local-user',
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      celebrationPending: false,
    };
  }
}
