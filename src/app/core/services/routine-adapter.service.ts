import { Injectable } from '@angular/core';
import {
  Habit,
  HabitCompletion,
  HabitFrequency,
  DayOfWeek,
} from '../../models/habit.model';
import {
  Routine,
  ScheduleType,
  ScheduleConfig,
  Task,
  TaskCompletion,
  RoutineInstance,
  RoutineInstanceStatus,
  RoutineStreak,
  RoutineWithStats,
} from '../../models/routine.model';
import { formatLocalDate } from '../utils/routine-schedule.utils';

@Injectable({ providedIn: 'root' })
export class RoutineAdapterService {
  habitToRoutine(habit: Habit): Routine {
    return {
      id: this.virtualRoutineId(habit.id),
      userId: habit.userId,
      name: habit.title,
      description: habit.description,
      color: habit.color,
      icon: habit.icon,
      scheduleType: this.mapScheduleType(habit.frequency),
      scheduleConfig: this.mapScheduleConfig(habit.frequency, habit.customDays, habit.reminderTime),
      active: !habit.isArchived,
      sort: 0,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt,
    };
  }

  habitToVirtualTask(habit: Habit): Task {
    return {
      id: this.virtualTaskId(habit.id),
      routineId: this.virtualRoutineId(habit.id),
      name: habit.title,
      description: habit.description,
      order: 0,
      defaultDurationMinutes: habit.targetPerDay,
      suggestedTimeOfDay: habit.reminderTime,
    };
  }

  habitCompletionToTaskCompletion(completion: HabitCompletion): TaskCompletion {
    return {
      id: completion.id,
      routineInstanceId: this.virtualInstanceId(completion.habitId, completion.completedAt),
      taskId: this.virtualTaskId(completion.habitId),
      userId: completion.userId,
      completedAt: completion.completedAt,
      durationSeconds: undefined,
      skipped: false,
      note: completion.note,
    };
  }

  habitToVirtualInstanceForDate(habit: Habit, date: Date, completed: boolean): RoutineInstance {
    return {
      id: this.virtualInstanceId(habit.id, date),
      routineId: this.virtualRoutineId(habit.id),
      userId: habit.userId,
      date: formatLocalDate(date),
      status: completed ? RoutineInstanceStatus.COMPLETED : RoutineInstanceStatus.PENDING,
      openedAt: completed ? date : undefined,
      closedAt: completed ? date : undefined,
      completionScore: completed ? 100 : 0,
    };
  }

  habitToRoutineWithStats(
    habit: Habit,
    completions: HabitCompletion[],
    streak: RoutineStreak,
    completionRate: number,
  ): RoutineWithStats {
    const routine = this.habitToRoutine(habit);
    const today = new Date();
    const completedToday = completions.some(
      c =>
        c.habitId === habit.id &&
        formatLocalDate(new Date(c.completedAt)) === formatLocalDate(today),
    );
    return {
      ...routine,
      tasks: [this.habitToVirtualTask(habit)],
      todayInstance: this.habitToVirtualInstanceForDate(habit, today, completedToday),
      streak,
      completionRate,
    };
  }

  isVirtualRoutine(routineId: string): boolean {
    return routineId.startsWith('habit::');
  }

  extractHabitId(virtualRoutineId: string): string | null {
    if (!this.isVirtualRoutine(virtualRoutineId)) return null;
    return virtualRoutineId.slice('habit::'.length);
  }

  private virtualRoutineId(habitId: string): string {
    return `habit::${habitId}`;
  }

  private virtualTaskId(habitId: string): string {
    return `habit-task::${habitId}`;
  }

  private virtualInstanceId(habitId: string, date: Date | string): string {
    const dateStr = typeof date === 'string' ? date : formatLocalDate(date);
    return `habit-instance::${habitId}::${dateStr}`;
  }

  private mapScheduleType(freq: HabitFrequency): ScheduleType {
    switch (freq) {
      case HabitFrequency.DAILY:
        return ScheduleType.DAILY;
      case HabitFrequency.WEEKLY:
      case HabitFrequency.WEEKDAYS:
      case HabitFrequency.WEEKENDS:
      case HabitFrequency.CUSTOM:
        return ScheduleType.WEEKLY;
    }
  }

  private mapScheduleConfig(
    freq: HabitFrequency,
    customDays: DayOfWeek[] | undefined,
    reminderTime: string | undefined,
  ): ScheduleConfig {
    switch (freq) {
      case HabitFrequency.DAILY:
        return { type: 'daily', timeWindowStart: reminderTime };
      case HabitFrequency.WEEKDAYS:
        return {
          type: 'weekly',
          days: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY],
          timeWindowStart: reminderTime,
        };
      case HabitFrequency.WEEKENDS:
        return {
          type: 'weekly',
          days: [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY],
          timeWindowStart: reminderTime,
        };
      case HabitFrequency.CUSTOM:
        return {
          type: 'weekly',
          days: customDays ?? [],
          timeWindowStart: reminderTime,
        };
      case HabitFrequency.WEEKLY:
        return {
          type: 'weekly',
          days: [DayOfWeek.MONDAY],
          timeWindowStart: reminderTime,
        };
    }
  }
}
