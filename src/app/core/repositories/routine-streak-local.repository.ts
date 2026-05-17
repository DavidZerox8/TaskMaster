import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { IRoutineStreakRepository } from '../interfaces/routine-streak-repository.interface';
import { RoutineStreak } from '../../models/routine.model';

@Injectable({ providedIn: 'root' })
export class RoutineStreakLocalRepository implements IRoutineStreakRepository {
  private readonly KEY = 'routine_streaks';
  private readonly DELAY_MS = 100;
  private readonly USER_ID = 'local-user';

  private deserialize(raw: any): RoutineStreak {
    return {
      ...raw,
      lastCompletedDate: raw.lastCompletedDate ? new Date(raw.lastCompletedDate) : null,
    };
  }

  private getFromStorage(): RoutineStreak[] {
    const stored = localStorage.getItem(this.KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((s: any) => this.deserialize(s));
  }

  private saveToStorage(data: RoutineStreak[]): void {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  }

  getAll(): Observable<RoutineStreak[]> {
    return of(this.getFromStorage()).pipe(delay(this.DELAY_MS));
  }

  getByRoutine(routineId: string): Observable<RoutineStreak | null> {
    const streaks = this.getFromStorage();
    return of(streaks.find(s => s.routineId === routineId) ?? null).pipe(delay(this.DELAY_MS));
  }

  upsert(streak: RoutineStreak): Observable<RoutineStreak> {
    const streaks = this.getFromStorage();
    const index = streaks.findIndex(s => s.routineId === streak.routineId);
    if (index === -1) {
      streaks.push(streak);
    } else {
      streaks[index] = streak;
    }
    this.saveToStorage(streaks);
    return of(streak).pipe(delay(this.DELAY_MS));
  }

  clearCelebration(routineId: string): Observable<RoutineStreak> {
    const streaks = this.getFromStorage();
    const index = streaks.findIndex(s => s.routineId === routineId);
    if (index === -1) {
      return throwError(() => new Error('Streak not found'));
    }
    streaks[index] = { ...streaks[index], celebrationPending: false };
    this.saveToStorage(streaks);
    return of(streaks[index]).pipe(delay(this.DELAY_MS));
  }

  reset(routineId: string): Observable<RoutineStreak> {
    const streaks = this.getFromStorage();
    const index = streaks.findIndex(s => s.routineId === routineId);
    const reset: RoutineStreak = {
      routineId,
      userId: this.USER_ID,
      currentStreak: 0,
      longestStreak: index === -1 ? 0 : streaks[index].longestStreak,
      lastCompletedDate: null,
      celebrationPending: false,
    };
    if (index === -1) {
      streaks.push(reset);
    } else {
      streaks[index] = reset;
    }
    this.saveToStorage(streaks);
    return of(reset).pipe(delay(this.DELAY_MS));
  }

  delete(routineId: string): Observable<boolean> {
    const streaks = this.getFromStorage();
    const filtered = streaks.filter(s => s.routineId !== routineId);
    if (filtered.length === streaks.length) {
      return of(false).pipe(delay(this.DELAY_MS));
    }
    this.saveToStorage(filtered);
    return of(true).pipe(delay(this.DELAY_MS));
  }
}
