import {
  ScheduleConfig,
  ScheduleType,
  isDailySchedule,
  isWeeklySchedule,
  isMonthlySchedule,
  isCustomCronSchedule,
} from './routine.model';
import { DayOfWeek } from './habit.model';

describe('routine.model — ScheduleConfig discriminated union', () => {
  it('narrows daily schedules and exposes timeWindowStart/End', () => {
    const config: ScheduleConfig = {
      type: 'daily',
      timeWindowStart: '07:00',
      timeWindowEnd: '09:00',
    };
    expect(isDailySchedule(config)).toBeTrue();
    expect(isWeeklySchedule(config)).toBeFalse();
    if (isDailySchedule(config)) {
      expect(config.timeWindowStart).toBe('07:00');
      expect(config.timeWindowEnd).toBe('09:00');
    }
  });

  it('narrows weekly schedules and exposes days', () => {
    const config: ScheduleConfig = {
      type: 'weekly',
      days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
      timeWindowStart: '06:30',
    };
    expect(isWeeklySchedule(config)).toBeTrue();
    expect(isDailySchedule(config)).toBeFalse();
    if (isWeeklySchedule(config)) {
      expect(config.days).toContain(DayOfWeek.MONDAY);
      expect(config.days.length).toBe(3);
    }
  });

  it('narrows monthly schedules and exposes dayOfMonth', () => {
    const config: ScheduleConfig = { type: 'monthly', dayOfMonth: 15 };
    expect(isMonthlySchedule(config)).toBeTrue();
    if (isMonthlySchedule(config)) {
      expect(config.dayOfMonth).toBe(15);
    }
  });

  it('narrows custom cron schedules', () => {
    const config: ScheduleConfig = { type: 'custom_cron', cron: '0 7 * * 1-5' };
    expect(isCustomCronSchedule(config)).toBeTrue();
    if (isCustomCronSchedule(config)) {
      expect(config.cron).toBe('0 7 * * 1-5');
    }
  });

  it('round-trips through JSON and preserves discriminator', () => {
    const original: ScheduleConfig = {
      type: 'weekly',
      days: [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY],
    };
    const restored: ScheduleConfig = JSON.parse(JSON.stringify(original));
    expect(restored.type).toBe('weekly');
    expect(isWeeklySchedule(restored)).toBeTrue();
  });

  it('exposes ScheduleType enum values', () => {
    expect(ScheduleType.DAILY).toBe('daily');
    expect(ScheduleType.WEEKLY).toBe('weekly');
    expect(ScheduleType.MONTHLY).toBe('monthly');
    expect(ScheduleType.CUSTOM_CRON).toBe('custom_cron');
  });
});
