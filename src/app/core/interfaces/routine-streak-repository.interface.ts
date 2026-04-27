import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { RoutineStreak } from '../../models/routine.model';

export interface IRoutineStreakRepository {
  getAll(): Observable<RoutineStreak[]>;
  getByRoutine(routineId: string): Observable<RoutineStreak | null>;
  upsert(streak: RoutineStreak): Observable<RoutineStreak>;
  clearCelebration(routineId: string): Observable<RoutineStreak>;
  reset(routineId: string): Observable<RoutineStreak>;
  delete(routineId: string): Observable<boolean>;
}

export const ROUTINE_STREAK_REPOSITORY_TOKEN = new InjectionToken<IRoutineStreakRepository>(
  'RoutineStreakRepository',
);
