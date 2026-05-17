import { calculateStreak, isScheduledForDay, isCompletedOnDate } from './streak.utils';
import { HabitCompletion, HabitFrequency, DayOfWeek } from '../../models/habit.model';
import { addDays, startOfDay } from './date.utils';

function completion(habitId: string, date: Date): HabitCompletion {
  return {
    id: `c_${date.getTime()}`,
    habitId,
    userId: 'u1',
    completedAt: date,
    xpEarned: 10,
  };
}

describe('streak.utils', () => {
  describe('isScheduledForDay', () => {
    it('DAILY always true', () => {
      for (let d = 0; d < 7; d++) {
        expect(isScheduledForDay(HabitFrequency.DAILY, d)).toBeTrue();
      }
    });

    it('WEEKDAYS true only Mon-Fri', () => {
      expect(isScheduledForDay(HabitFrequency.WEEKDAYS, 0)).toBeFalse();
      expect(isScheduledForDay(HabitFrequency.WEEKDAYS, 1)).toBeTrue();
      expect(isScheduledForDay(HabitFrequency.WEEKDAYS, 5)).toBeTrue();
      expect(isScheduledForDay(HabitFrequency.WEEKDAYS, 6)).toBeFalse();
    });

    it('WEEKENDS true only Sat/Sun', () => {
      expect(isScheduledForDay(HabitFrequency.WEEKENDS, 0)).toBeTrue();
      expect(isScheduledForDay(HabitFrequency.WEEKENDS, 6)).toBeTrue();
      expect(isScheduledForDay(HabitFrequency.WEEKENDS, 3)).toBeFalse();
    });

    it('CUSTOM respects customDays', () => {
      expect(isScheduledForDay(HabitFrequency.CUSTOM, 1, [DayOfWeek.MONDAY])).toBeTrue();
      expect(isScheduledForDay(HabitFrequency.CUSTOM, 2, [DayOfWeek.MONDAY])).toBeFalse();
    });
  });

  describe('calculateStreak', () => {
    it('returns zeros when no completions', () => {
      const result = calculateStreak([], HabitFrequency.DAILY);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.totalCompletions).toBe(0);
    });

    it('counts consecutive daily completions ending today', () => {
      const today = startOfDay(new Date());
      const comps = [
        completion('h1', today),
        completion('h1', addDays(today, -1)),
        completion('h1', addDays(today, -2)),
      ];
      const result = calculateStreak(comps, HabitFrequency.DAILY);
      expect(result.currentStreak).toBe(3);
      expect(result.totalCompletions).toBe(3);
    });

    it('breaks streak when gap exists on scheduled day', () => {
      const today = startOfDay(new Date());
      const comps = [
        completion('h1', today),
        completion('h1', addDays(today, -3)),
      ];
      const result = calculateStreak(comps, HabitFrequency.DAILY);
      expect(result.currentStreak).toBe(1);
    });

    it('allows gap over non-scheduled days for WEEKDAYS frequency', () => {
      // Build a fixed Friday and the following Monday so Sat/Sun are the only gap.
      // Both must be in the past so daysSinceLast accounting is deterministic.
      const today = startOfDay(new Date());
      let monday = addDays(today, -7);
      while (monday.getDay() !== 1) monday = addDays(monday, -1);
      const fridayBefore = addDays(monday, -3);
      const comps = [
        completion('h1', monday),
        completion('h1', fridayBefore),
      ];
      const result = calculateStreak(comps, HabitFrequency.WEEKDAYS);
      expect(result.longestStreak).toBeGreaterThanOrEqual(2);
    });

    it('deduplicates same-day completions', () => {
      const today = startOfDay(new Date());
      const morning = new Date(today);
      morning.setHours(8, 0, 0, 0);
      const evening = new Date(today);
      evening.setHours(20, 0, 0, 0);
      const comps = [
        completion('h1', morning),
        completion('h1', evening),
      ];
      const result = calculateStreak(comps, HabitFrequency.DAILY);
      expect(result.currentStreak).toBe(1);
    });
  });

  describe('isCompletedOnDate', () => {
    it('detects completion on same day', () => {
      const today = startOfDay(new Date());
      const comps = [completion('h1', today)];
      expect(isCompletedOnDate(comps, today)).toBeTrue();
      expect(isCompletedOnDate(comps, addDays(today, -1))).toBeFalse();
    });
  });
});
