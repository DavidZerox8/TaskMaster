import { TestBed } from '@angular/core/testing';
import { RoutineAdapterService } from './routine-adapter.service';
import {
  Habit,
  HabitCategory,
  HabitFrequency,
  HabitType,
  DayOfWeek,
} from '../../models/habit.model';
import {
  ScheduleType,
  isDailySchedule,
  isWeeklySchedule,
} from '../../models/routine.model';

describe('RoutineAdapterService', () => {
  let adapter: RoutineAdapterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adapter = TestBed.inject(RoutineAdapterService);
  });

  function makeHabit(partial: Partial<Habit>): Habit {
    return {
      id: 'h1',
      userId: 'u1',
      title: 'Read',
      description: 'Read 20m',
      category: HabitCategory.LEARNING,
      type: HabitType.BUILD,
      frequency: HabitFrequency.DAILY,
      isArchived: false,
      icon: '📚',
      color: '#abcdef',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-15'),
      ...partial,
    };
  }

  it('maps DAILY habit to daily schedule', () => {
    const habit = makeHabit({ frequency: HabitFrequency.DAILY, reminderTime: '08:00' });
    const routine = adapter.habitToRoutine(habit);
    expect(routine.scheduleType).toBe(ScheduleType.DAILY);
    expect(isDailySchedule(routine.scheduleConfig)).toBeTrue();
    if (isDailySchedule(routine.scheduleConfig)) {
      expect(routine.scheduleConfig.timeWindowStart).toBe('08:00');
    }
    expect(adapter.isVirtualRoutine(routine.id)).toBeTrue();
    expect(adapter.extractHabitId(routine.id)).toBe('h1');
  });

  it('maps WEEKDAYS habit to weekly schedule with Mon-Fri', () => {
    const habit = makeHabit({ frequency: HabitFrequency.WEEKDAYS });
    const routine = adapter.habitToRoutine(habit);
    expect(routine.scheduleType).toBe(ScheduleType.WEEKLY);
    if (isWeeklySchedule(routine.scheduleConfig)) {
      expect(routine.scheduleConfig.days).toEqual([
        DayOfWeek.MONDAY,
        DayOfWeek.TUESDAY,
        DayOfWeek.WEDNESDAY,
        DayOfWeek.THURSDAY,
        DayOfWeek.FRIDAY,
      ]);
    } else {
      fail('expected weekly schedule');
    }
  });

  it('maps WEEKENDS habit to Sat+Sun', () => {
    const habit = makeHabit({ frequency: HabitFrequency.WEEKENDS });
    const routine = adapter.habitToRoutine(habit);
    if (isWeeklySchedule(routine.scheduleConfig)) {
      expect(routine.scheduleConfig.days).toContain(DayOfWeek.SATURDAY);
      expect(routine.scheduleConfig.days).toContain(DayOfWeek.SUNDAY);
    } else {
      fail('expected weekly schedule');
    }
  });

  it('maps CUSTOM habit using customDays', () => {
    const habit = makeHabit({
      frequency: HabitFrequency.CUSTOM,
      customDays: [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY],
    });
    const routine = adapter.habitToRoutine(habit);
    if (isWeeklySchedule(routine.scheduleConfig)) {
      expect(routine.scheduleConfig.days).toEqual([DayOfWeek.TUESDAY, DayOfWeek.THURSDAY]);
    } else {
      fail('expected weekly schedule');
    }
  });

  it('produces a single virtual task per habit', () => {
    const habit = makeHabit({});
    const task = adapter.habitToVirtualTask(habit);
    expect(task.routineId).toBe(`habit::${habit.id}`);
    expect(task.id).toBe(`habit-task::${habit.id}`);
    expect(task.order).toBe(0);
  });

  it('builds RoutineWithStats marking completedToday when applicable', () => {
    const habit = makeHabit({});
    const today = new Date();
    const stats = adapter.habitToRoutineWithStats(
      habit,
      [
        {
          id: 'c1',
          habitId: habit.id,
          userId: habit.userId,
          completedAt: today,
          xpEarned: 10,
        },
      ],
      {
        routineId: `habit::${habit.id}`,
        userId: habit.userId,
        currentStreak: 3,
        longestStreak: 5,
        lastCompletedDate: today,
        celebrationPending: false,
      },
      75,
    );
    expect(stats.tasks.length).toBe(1);
    expect(stats.streak.currentStreak).toBe(3);
    expect(stats.completionRate).toBe(75);
    expect(stats.todayInstance?.completionScore).toBe(100);
  });

  it('isVirtualRoutine returns false for non-prefixed IDs', () => {
    expect(adapter.isVirtualRoutine('habit::abc')).toBeTrue();
    expect(adapter.isVirtualRoutine('xyz123')).toBeFalse();
    expect(adapter.extractHabitId('xyz123')).toBeNull();
  });
});
