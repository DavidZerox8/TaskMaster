import { ScheduleConfig, isDailySchedule, isWeeklySchedule, isMonthlySchedule } from '../../models/routine.model';
import { DayOfWeek } from '../../models/habit.model';

export function isRoutineScheduledForDate(config: ScheduleConfig, date: Date): boolean {
  if (isDailySchedule(config)) return true;
  if (isWeeklySchedule(config)) {
    return config.days.includes(date.getDay() as DayOfWeek);
  }
  if (isMonthlySchedule(config)) {
    return date.getDate() === config.dayOfMonth;
  }
  return true;
}

export function formatLocalDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}
