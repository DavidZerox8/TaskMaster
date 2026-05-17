import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { AdaptiveRecommendationsService } from './adaptive-recommendations.service';
import {
  AdaptiveSuggestion,
  AdaptiveSuggestionCreateRequest,
  AdaptiveSuggestionStatus,
  AdaptiveSuggestionType,
  AdaptiveSuggestionUpdateRequest,
} from '../../models/adaptive.model';
import { ADAPTIVE_SUGGESTION_REPOSITORY_TOKEN } from '../interfaces/adaptive-suggestion-repository.interface';
import { ROUTINE_REPOSITORY_TOKEN } from '../interfaces/routine-repository.interface';
import { ROUTINE_INSTANCE_REPOSITORY_TOKEN } from '../interfaces/routine-instance-repository.interface';
import { ROUTINE_STREAK_REPOSITORY_TOKEN } from '../interfaces/routine-streak-repository.interface';
import { TASK_COMPLETION_REPOSITORY_TOKEN } from '../interfaces/task-completion-repository.interface';
import {
  Routine,
  RoutineInstance,
  RoutineInstanceStatus,
  RoutineStreak,
  ScheduleType,
  TaskCompletion,
} from '../../models/routine.model';
import { formatLocalDate } from '../utils/routine-schedule.utils';

class FakeAdaptiveRepo {
  list: AdaptiveSuggestion[] = [];

  getAll(status?: AdaptiveSuggestionStatus): Observable<AdaptiveSuggestion[]> {
    return of(status ? this.list.filter(s => s.status === status) : [...this.list]);
  }
  getByRoutine(routineId: string): Observable<AdaptiveSuggestion[]> {
    return of(this.list.filter(s => s.routineId === routineId));
  }
  getById(id: string): Observable<AdaptiveSuggestion | null> {
    return of(this.list.find(s => s.id === id) ?? null);
  }
  create(request: AdaptiveSuggestionCreateRequest): Observable<AdaptiveSuggestion> {
    const created: AdaptiveSuggestion = {
      id: `s_${this.list.length}`,
      userId: 'u1',
      routineId: request.routineId,
      type: request.type,
      payload: request.payload,
      status: AdaptiveSuggestionStatus.PROPOSED,
      createdAt: new Date(),
    };
    this.list.push(created);
    return of(created);
  }
  update(id: string, request: AdaptiveSuggestionUpdateRequest): Observable<AdaptiveSuggestion> {
    const idx = this.list.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('not found');
    this.list[idx] = {
      ...this.list[idx],
      status: request.status ?? this.list[idx].status,
      resolvedAt: request.resolvedAt ?? this.list[idx].resolvedAt,
      appliedSnapshot: request.appliedSnapshot ?? this.list[idx].appliedSnapshot,
    };
    return of(this.list[idx]);
  }
  delete(): Observable<boolean> { return of(true); }
  hasOpenForRoutineAndType(routineId: string, type: AdaptiveSuggestionType): Observable<boolean> {
    return of(
      this.list.some(
        s =>
          s.routineId === routineId &&
          s.type === type &&
          s.status === AdaptiveSuggestionStatus.PROPOSED,
      ),
    );
  }
}

class FakeRoutineRepo {
  routines: Routine[] = [];
  getAll(): Observable<Routine[]> { return of([...this.routines]); }
  getById(id: string): Observable<Routine | null> {
    return of(this.routines.find(r => r.id === id) ?? null);
  }
  update(id: string, patch: Partial<Routine>): Observable<Routine> {
    const idx = this.routines.findIndex(r => r.id === id);
    this.routines[idx] = { ...this.routines[idx], ...patch, updatedAt: new Date() };
    return of(this.routines[idx]);
  }
}

class FakeInstanceRepo {
  instances: RoutineInstance[] = [];
  getAll(): Observable<RoutineInstance[]> { return of([...this.instances]); }
  getByRoutine(routineId: string): Observable<RoutineInstance[]> {
    return of(this.instances.filter(i => i.routineId === routineId));
  }
}

class FakeStreakRepo {
  streaks: RoutineStreak[] = [];
  getAll(): Observable<RoutineStreak[]> { return of([...this.streaks]); }
}

class FakeCompletionRepo {
  completions: TaskCompletion[] = [];
  getAll(): Observable<TaskCompletion[]> { return of([...this.completions]); }
}

function makeRoutine(partial: Partial<Routine> & { id: string; name: string }): Routine {
  return {
    userId: 'u1',
    scheduleType: ScheduleType.DAILY,
    scheduleConfig: { type: 'daily' },
    active: true,
    sort: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  } as Routine;
}

function makeInstance(routineId: string, date: Date, status = RoutineInstanceStatus.COMPLETED): RoutineInstance {
  return {
    id: `i_${routineId}_${date.getTime()}`,
    routineId,
    userId: 'u1',
    date: formatLocalDate(date),
    status,
    completionScore: 100,
  };
}

function makeCompletion(instanceId: string, completedAt: Date): TaskCompletion {
  return {
    id: `c_${instanceId}_${completedAt.getTime()}`,
    routineInstanceId: instanceId,
    taskId: 't1',
    userId: 'u1',
    completedAt,
    skipped: false,
  };
}

describe('AdaptiveRecommendationsService', () => {
  let service: AdaptiveRecommendationsService;
  let adaptiveRepo: FakeAdaptiveRepo;
  let routineRepo: FakeRoutineRepo;
  let instanceRepo: FakeInstanceRepo;
  let streakRepo: FakeStreakRepo;
  let completionRepo: FakeCompletionRepo;

  beforeEach(() => {
    adaptiveRepo = new FakeAdaptiveRepo();
    routineRepo = new FakeRoutineRepo();
    instanceRepo = new FakeInstanceRepo();
    streakRepo = new FakeStreakRepo();
    completionRepo = new FakeCompletionRepo();

    TestBed.configureTestingModule({
      providers: [
        { provide: ADAPTIVE_SUGGESTION_REPOSITORY_TOKEN, useValue: adaptiveRepo },
        { provide: ROUTINE_REPOSITORY_TOKEN, useValue: routineRepo },
        { provide: ROUTINE_INSTANCE_REPOSITORY_TOKEN, useValue: instanceRepo },
        { provide: ROUTINE_STREAK_REPOSITORY_TOKEN, useValue: streakRepo },
        { provide: TASK_COMPLETION_REPOSITORY_TOKEN, useValue: completionRepo },
      ],
    });
    service = TestBed.inject(AdaptiveRecommendationsService);
  });

  describe('flagStreakCelebrations', () => {
    it('produces suggestion when celebrationPending is true', done => {
      const routine = makeRoutine({ id: 'r1', name: 'Yoga' });
      routineRepo.routines.push(routine);
      streakRepo.streaks.push({
        routineId: 'r1',
        userId: 'u1',
        currentStreak: 7,
        longestStreak: 7,
        lastCompletedDate: new Date(),
        celebrationPending: true,
      });

      service.flagStreakCelebrations().subscribe(list => {
        expect(list.length).toBe(1);
        expect(list[0].type).toBe(AdaptiveSuggestionType.STREAK_CELEBRATION);
        if (list[0].payload.type === 'streak_celebration') {
          expect(list[0].payload.currentStreak).toBe(7);
          expect(list[0].payload.milestone).toBe(7);
        }
        done();
      });
    });

    it('skips when celebrationPending is false', done => {
      routineRepo.routines.push(makeRoutine({ id: 'r1', name: 'Yoga' }));
      streakRepo.streaks.push({
        routineId: 'r1',
        userId: 'u1',
        currentStreak: 7,
        longestStreak: 7,
        lastCompletedDate: new Date(),
        celebrationPending: false,
      });

      service.flagStreakCelebrations().subscribe(list => {
        expect(list.length).toBe(0);
        done();
      });
    });
  });

  describe('adjustTimeWindows', () => {
    it('proposes new time when dominant hour drifts >= 30 min from current', done => {
      const routine = makeRoutine({
        id: 'r1',
        name: 'Lectura',
        scheduleConfig: { type: 'daily', timeWindowStart: '07:00' },
      });
      routineRepo.routines.push(routine);

      const instances: RoutineInstance[] = [];
      const completions: TaskCompletion[] = [];
      const baseDate = new Date(2026, 0, 1);
      for (let i = 0; i < 6; i++) {
        const day = new Date(baseDate);
        day.setDate(day.getDate() + i);
        const instance = makeInstance('r1', day);
        instances.push(instance);
        const completedAt = new Date(day);
        completedAt.setHours(9, 15, 0, 0);
        completions.push(makeCompletion(instance.id, completedAt));
      }
      instanceRepo.instances.push(...instances);
      completionRepo.completions.push(...completions);

      service.adjustTimeWindows().subscribe(list => {
        expect(list.length).toBe(1);
        expect(list[0].type).toBe(AdaptiveSuggestionType.TIME_WINDOW_ADJUST);
        if (list[0].payload.type === 'time_window_adjust') {
          expect(list[0].payload.proposedStart).toBe('09:00');
          expect(list[0].payload.currentStart).toBe('07:00');
        }
        done();
      });
    });

    it('skips when fewer than min samples', done => {
      const routine = makeRoutine({
        id: 'r1',
        name: 'Pocos datos',
        scheduleConfig: { type: 'daily', timeWindowStart: '07:00' },
      });
      routineRepo.routines.push(routine);
      const instance = makeInstance('r1', new Date());
      instanceRepo.instances.push(instance);
      const c = makeCompletion(instance.id, new Date(2026, 0, 1, 9, 0));
      completionRepo.completions.push(c);

      service.adjustTimeWindows().subscribe(list => {
        expect(list.length).toBe(0);
        done();
      });
    });
  });

  describe('runAll', () => {
    it('aggregates streak + time-window detections in one pass', done => {
      const routine = makeRoutine({
        id: 'r1',
        name: 'Run all',
        scheduleConfig: { type: 'daily', timeWindowStart: '06:00' },
      });
      routineRepo.routines.push(routine);
      streakRepo.streaks.push({
        routineId: 'r1',
        userId: 'u1',
        currentStreak: 14,
        longestStreak: 14,
        lastCompletedDate: new Date(),
        celebrationPending: true,
      });

      const baseDate = new Date(2026, 0, 1);
      for (let i = 0; i < 6; i++) {
        const day = new Date(baseDate);
        day.setDate(day.getDate() + i);
        const instance = makeInstance('r1', day);
        instanceRepo.instances.push(instance);
        const completedAt = new Date(day);
        completedAt.setHours(8, 0, 0, 0);
        completionRepo.completions.push(makeCompletion(instance.id, completedAt));
      }

      service.runAll().subscribe(created => {
        const types = created.map(c => c.type);
        expect(types).toContain(AdaptiveSuggestionType.STREAK_CELEBRATION);
        expect(types).toContain(AdaptiveSuggestionType.TIME_WINDOW_ADJUST);
        done();
      });
    });

    it('skips when already running', done => {
      // First call sets running=true synchronously via tap → tap fires after subscribe
      service.runAll().subscribe();
      service.runAll().subscribe(list => {
        expect(list).toEqual([]);
        done();
      });
    });
  });

  describe('acceptSuggestion (time_window_adjust)', () => {
    it('updates routine schedule and stores snapshot', done => {
      const routine = makeRoutine({
        id: 'r1',
        name: 'Apply window',
        scheduleConfig: { type: 'daily', timeWindowStart: '07:00' },
      });
      routineRepo.routines.push(routine);

      adaptiveRepo.list.push({
        id: 's1',
        userId: 'u1',
        routineId: 'r1',
        type: AdaptiveSuggestionType.TIME_WINDOW_ADJUST,
        payload: {
          type: 'time_window_adjust',
          currentStart: '07:00',
          proposedStart: '09:00',
          reason: 'shift',
          sampleSize: 5,
        },
        status: AdaptiveSuggestionStatus.PROPOSED,
        createdAt: new Date(),
      });

      service.acceptSuggestion(adaptiveRepo.list[0]).subscribe(updated => {
        expect(updated.status).toBe(AdaptiveSuggestionStatus.ACCEPTED);
        expect(updated.appliedSnapshot?.['scheduleConfig']).toEqual({ type: 'daily', timeWindowStart: '07:00' });
        const refreshed = routineRepo.routines.find(r => r.id === 'r1')!;
        if (refreshed.scheduleConfig.type === 'daily') {
          expect(refreshed.scheduleConfig.timeWindowStart).toBe('09:00');
        } else {
          fail('expected daily schedule');
        }
        done();
      });
    });
  });
});
