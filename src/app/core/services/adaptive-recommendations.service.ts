import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, of, switchMap, map, catchError, tap } from 'rxjs';
import {
  AdaptiveSuggestion,
  AdaptiveSuggestionStatus,
  AdaptiveSuggestionType,
  MissedRoutinePayload,
  StreakCelebrationPayload,
  TimeWindowAdjustPayload,
} from '../../models/adaptive.model';
import {
  Routine,
  RoutineInstance,
  RoutineInstanceStatus,
  RoutineStreak,
  ScheduleConfig,
  isDailySchedule,
  isMonthlySchedule,
  isWeeklySchedule,
  TaskCompletion,
} from '../../models/routine.model';
import { ADAPTIVE_SUGGESTION_REPOSITORY_TOKEN } from '../interfaces/adaptive-suggestion-repository.interface';
import { ROUTINE_REPOSITORY_TOKEN } from '../interfaces/routine-repository.interface';
import { ROUTINE_INSTANCE_REPOSITORY_TOKEN } from '../interfaces/routine-instance-repository.interface';
import { ROUTINE_STREAK_REPOSITORY_TOKEN } from '../interfaces/routine-streak-repository.interface';
import { TASK_COMPLETION_REPOSITORY_TOKEN } from '../interfaces/task-completion-repository.interface';
import { formatLocalDate, isRoutineScheduledForDate, parseLocalDate } from '../utils/routine-schedule.utils';

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 66, 100, 200, 365];
const MIN_SAMPLES_FOR_TIME_SUGGESTION = 4;
const TIME_WINDOW_DRIFT_MINUTES = 30;
const MISSED_ROUTINE_THRESHOLD_DAYS = 3;

interface TimeBucket { hour: number; count: number; }

@Injectable({ providedIn: 'root' })
export class AdaptiveRecommendationsService {
  private readonly suggestionRepo = inject(ADAPTIVE_SUGGESTION_REPOSITORY_TOKEN);
  private readonly routineRepo = inject(ROUTINE_REPOSITORY_TOKEN);
  private readonly instanceRepo = inject(ROUTINE_INSTANCE_REPOSITORY_TOKEN);
  private readonly streakRepo = inject(ROUTINE_STREAK_REPOSITORY_TOKEN);
  private readonly completionRepo = inject(TASK_COMPLETION_REPOSITORY_TOKEN);

  private readonly _suggestions = signal<AdaptiveSuggestion[]>([]);
  private readonly _running = signal(false);
  private readonly _lastRunAt = signal<Date | null>(null);

  readonly suggestions = this._suggestions.asReadonly();
  readonly running = this._running.asReadonly();
  readonly lastRunAt = this._lastRunAt.asReadonly();

  readonly proposedSuggestions = computed(() =>
    this._suggestions().filter(s => s.status === AdaptiveSuggestionStatus.PROPOSED),
  );

  loadOpen(): void {
    this.suggestionRepo.getAll(AdaptiveSuggestionStatus.PROPOSED).subscribe({
      next: list => this._suggestions.set(list),
    });
  }

  suggestionsForRoutine(routineId: string): AdaptiveSuggestion[] {
    return this.proposedSuggestions().filter(s => s.routineId === routineId);
  }

  acceptSuggestion(suggestion: AdaptiveSuggestion): Observable<AdaptiveSuggestion> {
    if (suggestion.type === AdaptiveSuggestionType.TIME_WINDOW_ADJUST) {
      return this.applyTimeWindow(suggestion);
    }
    return this.markStatus(suggestion.id, AdaptiveSuggestionStatus.ACCEPTED);
  }

  dismissSuggestion(id: string): Observable<AdaptiveSuggestion> {
    return this.markStatus(id, AdaptiveSuggestionStatus.DISMISSED);
  }

  revertSuggestion(suggestion: AdaptiveSuggestion): Observable<AdaptiveSuggestion> {
    if (suggestion.type !== AdaptiveSuggestionType.TIME_WINDOW_ADJUST) {
      return this.markStatus(suggestion.id, AdaptiveSuggestionStatus.REVERTED);
    }
    const snapshot = suggestion.appliedSnapshot;
    if (!snapshot || typeof snapshot['scheduleConfig'] !== 'object') {
      return this.markStatus(suggestion.id, AdaptiveSuggestionStatus.REVERTED);
    }
    return this.routineRepo.update(suggestion.routineId, {
      scheduleConfig: snapshot['scheduleConfig'] as ScheduleConfig,
    }).pipe(
      switchMap(() => this.markStatus(suggestion.id, AdaptiveSuggestionStatus.REVERTED)),
    );
  }

  runAll(): Observable<AdaptiveSuggestion[]> {
    if (this._running()) return of([]);
    this._running.set(true);

    return this.routineRepo.getAll().pipe(
      switchMap(routines => {
        const active = routines.filter(r => r.active);
        if (active.length === 0) return of([]);
        return forkJoin([
          this.completionRepo.getAll(),
          this.streakRepo.getAll(),
          this.instanceRepo.getAll(),
        ]).pipe(
          switchMap(([completions, streaks, instances]) =>
            this.processAll(active, completions, streaks, instances),
          ),
        );
      }),
      tap(created => {
        this._running.set(false);
        this._lastRunAt.set(new Date());
        if (created.length > 0) {
          this._suggestions.update(list => [
            ...list.filter(s => !created.find(c => c.id === s.id)),
            ...created,
          ]);
        }
      }),
      catchError(err => {
        this._running.set(false);
        console.warn('AdaptiveRecommendations runAll failed', err);
        return of([] as AdaptiveSuggestion[]);
      }),
    );
  }

  // ─── Pipelines ───────────────────────────────────────────────────

  private processAll(
    routines: Routine[],
    completions: TaskCompletion[],
    streaks: RoutineStreak[],
    instances: RoutineInstance[],
  ): Observable<AdaptiveSuggestion[]> {
    const ops: Observable<AdaptiveSuggestion | null>[] = [];

    for (const routine of routines) {
      ops.push(this.maybeProposeTimeWindow(routine, completions, instances));
      ops.push(this.maybeFlagMissedRoutine(routine, instances));

      const streak = streaks.find(s => s.routineId === routine.id);
      if (streak) ops.push(this.maybeFlagStreakCelebration(routine, streak));
    }

    if (ops.length === 0) return of([]);
    return forkJoin(ops).pipe(
      map(results => results.filter((r): r is AdaptiveSuggestion => r !== null)),
    );
  }

  updateSuggestedTimes(routineId: string): Observable<AdaptiveSuggestion | null> {
    return forkJoin([
      this.routineRepo.getById(routineId),
      this.instanceRepo.getByRoutine(routineId),
      this.completionRepo.getAll(),
    ]).pipe(
      switchMap(([routine, instances, allCompletions]) => {
        if (!routine) return of(null);
        return this.maybeProposeTimeWindow(routine, allCompletions, instances);
      }),
    );
  }

  flagMissedRoutines(): Observable<AdaptiveSuggestion[]> {
    return forkJoin([this.routineRepo.getAll(), this.instanceRepo.getAll()]).pipe(
      switchMap(([routines, instances]) => {
        const ops = routines
          .filter(r => r.active)
          .map(r => this.maybeFlagMissedRoutine(r, instances));
        if (ops.length === 0) return of([]);
        return forkJoin(ops).pipe(
          map(list => list.filter((s): s is AdaptiveSuggestion => s !== null)),
        );
      }),
    );
  }

  flagStreakCelebrations(): Observable<AdaptiveSuggestion[]> {
    return forkJoin([this.routineRepo.getAll(), this.streakRepo.getAll()]).pipe(
      switchMap(([routines, streaks]) => {
        const ops = streaks
          .map(s => {
            const routine = routines.find(r => r.id === s.routineId);
            if (!routine || !routine.active) return of(null as AdaptiveSuggestion | null);
            return this.maybeFlagStreakCelebration(routine, s);
          });
        if (ops.length === 0) return of([]);
        return forkJoin(ops).pipe(
          map(list => list.filter((s): s is AdaptiveSuggestion => s !== null)),
        );
      }),
    );
  }

  adjustTimeWindows(): Observable<AdaptiveSuggestion[]> {
    return forkJoin([
      this.routineRepo.getAll(),
      this.instanceRepo.getAll(),
      this.completionRepo.getAll(),
    ]).pipe(
      switchMap(([routines, instances, completions]) => {
        const ops = routines
          .filter(r => r.active)
          .map(r => this.maybeProposeTimeWindow(r, completions, instances));
        if (ops.length === 0) return of([]);
        return forkJoin(ops).pipe(
          map(list => list.filter((s): s is AdaptiveSuggestion => s !== null)),
        );
      }),
    );
  }

  // ─── Detection helpers ───────────────────────────────────────────

  private maybeProposeTimeWindow(
    routine: Routine,
    completions: TaskCompletion[],
    instances: RoutineInstance[],
  ): Observable<AdaptiveSuggestion | null> {
    const routineInstanceIds = new Set(
      instances.filter(i => i.routineId === routine.id).map(i => i.id),
    );
    const recent = completions
      .filter(c => routineInstanceIds.has(c.routineInstanceId))
      .map(c => new Date(c.completedAt))
      .filter(d => !Number.isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())
      .slice(0, 30);

    if (recent.length < MIN_SAMPLES_FOR_TIME_SUGGESTION) return of(null);

    const dominant = this.dominantHour(recent);
    if (dominant === null) return of(null);

    const currentStart = this.currentTimeWindowStart(routine.scheduleConfig);
    const proposedStart = `${String(dominant).padStart(2, '0')}:00`;

    if (currentStart) {
      const driftMinutes = this.diffMinutes(currentStart, proposedStart);
      if (Math.abs(driftMinutes) < TIME_WINDOW_DRIFT_MINUTES) return of(null);
    }

    return this.suggestionRepo
      .hasOpenForRoutineAndType(routine.id, AdaptiveSuggestionType.TIME_WINDOW_ADJUST)
      .pipe(
        switchMap(exists => {
          if (exists) return of(null);
          const payload: TimeWindowAdjustPayload = {
            type: 'time_window_adjust',
            currentStart: currentStart ?? undefined,
            proposedStart,
            reason: currentStart
              ? `Sueles completar a las ${proposedStart} (no a las ${currentStart}).`
              : `Sueles completar a las ${proposedStart}. Configura un horario fijo.`,
            sampleSize: recent.length,
          };
          return this.suggestionRepo.create({
            routineId: routine.id,
            type: AdaptiveSuggestionType.TIME_WINDOW_ADJUST,
            payload,
          });
        }),
      );
  }

  private maybeFlagMissedRoutine(
    routine: Routine,
    instances: RoutineInstance[],
  ): Observable<AdaptiveSuggestion | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recentInstances = instances
      .filter(i => i.routineId === routine.id)
      .map(i => ({ ...i, dateObj: parseLocalDate(i.date) }))
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    let missedScheduledDays = 0;
    let lastCompletedAt: Date | null = null;
    const cursor = new Date(today);

    for (let offset = 0; offset < 14; offset++) {
      const day = new Date(cursor);
      day.setDate(day.getDate() - offset);
      if (!isRoutineScheduledForDate(routine.scheduleConfig, day)) continue;

      const dayStr = formatLocalDate(day);
      const inst = recentInstances.find(i => i.date === dayStr);
      if (inst && inst.status === RoutineInstanceStatus.COMPLETED) {
        lastCompletedAt = inst.dateObj;
        break;
      }
      if (offset === 0) continue; // do not penalize today, user may still complete
      missedScheduledDays += 1;
    }

    if (missedScheduledDays < MISSED_ROUTINE_THRESHOLD_DAYS) return of(null);

    return this.suggestionRepo
      .hasOpenForRoutineAndType(routine.id, AdaptiveSuggestionType.MISSED_ROUTINE)
      .pipe(
        switchMap(exists => {
          if (exists) return of(null);
          const payload: MissedRoutinePayload = {
            type: 'missed_routine',
            daysMissed: missedScheduledDays,
            lastCompletedAt: lastCompletedAt ? formatLocalDate(lastCompletedAt) : undefined,
            encouragement: 'Reinicia con una version corta de la rutina.',
          };
          return this.suggestionRepo.create({
            routineId: routine.id,
            type: AdaptiveSuggestionType.MISSED_ROUTINE,
            payload,
          });
        }),
      );
  }

  private maybeFlagStreakCelebration(
    routine: Routine,
    streak: RoutineStreak,
  ): Observable<AdaptiveSuggestion | null> {
    if (!streak.celebrationPending) return of(null);
    const milestone = STREAK_MILESTONES
      .filter(m => m <= streak.currentStreak)
      .pop() ?? streak.currentStreak;

    return this.suggestionRepo
      .hasOpenForRoutineAndType(routine.id, AdaptiveSuggestionType.STREAK_CELEBRATION)
      .pipe(
        switchMap(exists => {
          if (exists) return of(null);
          const payload: StreakCelebrationPayload = {
            type: 'streak_celebration',
            currentStreak: streak.currentStreak,
            milestone,
            message: `Llevas ${streak.currentStreak} dias consecutivos en "${routine.name}".`,
          };
          return this.suggestionRepo.create({
            routineId: routine.id,
            type: AdaptiveSuggestionType.STREAK_CELEBRATION,
            payload,
          });
        }),
      );
  }

  // ─── Mutation helpers ────────────────────────────────────────────

  private applyTimeWindow(suggestion: AdaptiveSuggestion): Observable<AdaptiveSuggestion> {
    if (suggestion.payload.type !== 'time_window_adjust') {
      return this.markStatus(suggestion.id, AdaptiveSuggestionStatus.ACCEPTED);
    }
    const proposed = suggestion.payload.proposedStart;

    return this.routineRepo.getById(suggestion.routineId).pipe(
      switchMap(routine => {
        if (!routine) {
          return this.markStatus(suggestion.id, AdaptiveSuggestionStatus.DISMISSED);
        }
        const previousConfig: ScheduleConfig = JSON.parse(JSON.stringify(routine.scheduleConfig));
        const nextConfig = this.applyTimeWindowToConfig(routine.scheduleConfig, proposed);
        if (!nextConfig) {
          return this.markStatus(suggestion.id, AdaptiveSuggestionStatus.DISMISSED);
        }
        return this.routineRepo.update(routine.id, { scheduleConfig: nextConfig }).pipe(
          switchMap(() =>
            this.suggestionRepo.update(suggestion.id, {
              status: AdaptiveSuggestionStatus.ACCEPTED,
              resolvedAt: new Date(),
              appliedSnapshot: { scheduleConfig: previousConfig },
            }),
          ),
          tap(updated => this.replaceLocal(updated)),
        );
      }),
    );
  }

  private applyTimeWindowToConfig(
    config: ScheduleConfig,
    proposedStart: string,
  ): ScheduleConfig | null {
    if (isDailySchedule(config)) {
      return { ...config, timeWindowStart: proposedStart };
    }
    if (isWeeklySchedule(config)) {
      return { ...config, timeWindowStart: proposedStart };
    }
    if (isMonthlySchedule(config)) {
      return { ...config, timeWindowStart: proposedStart };
    }
    return null;
  }

  private markStatus(
    id: string,
    status: AdaptiveSuggestionStatus,
  ): Observable<AdaptiveSuggestion> {
    return this.suggestionRepo.update(id, { status, resolvedAt: new Date() }).pipe(
      tap(updated => this.replaceLocal(updated)),
    );
  }

  private replaceLocal(updated: AdaptiveSuggestion): void {
    this._suggestions.update(list => {
      const isOpen = updated.status === AdaptiveSuggestionStatus.PROPOSED;
      const others = list.filter(s => s.id !== updated.id);
      return isOpen ? [...others, updated] : others;
    });
  }

  // ─── Stats helpers ───────────────────────────────────────────────

  private dominantHour(dates: Date[]): number | null {
    if (dates.length === 0) return null;
    const buckets = new Map<number, number>();
    for (const d of dates) {
      const h = d.getHours();
      buckets.set(h, (buckets.get(h) ?? 0) + 1);
    }
    let best: TimeBucket | null = null;
    for (const [hour, count] of buckets.entries()) {
      if (!best || count > best.count) best = { hour, count };
    }
    if (!best) return null;
    return best.count >= MIN_SAMPLES_FOR_TIME_SUGGESTION / 2 ? best.hour : null;
  }

  private currentTimeWindowStart(config: ScheduleConfig): string | null {
    if (isDailySchedule(config) || isWeeklySchedule(config) || isMonthlySchedule(config)) {
      return config.timeWindowStart ?? null;
    }
    return null;
  }

  private diffMinutes(a: string, b: string): number {
    const [ah, am] = a.split(':').map(Number);
    const [bh, bm] = b.split(':').map(Number);
    if ([ah, am, bh, bm].some(n => Number.isNaN(n))) return 0;
    return (bh * 60 + bm) - (ah * 60 + am);
  }
}
