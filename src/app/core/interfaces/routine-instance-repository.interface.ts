import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { RoutineInstance, RoutineInstanceStatus } from '../../models/routine.model';

export interface IRoutineInstanceRepository {
  getAll(): Observable<RoutineInstance[]>;
  getById(id: string): Observable<RoutineInstance | null>;
  getByRoutine(routineId: string, from?: Date, to?: Date): Observable<RoutineInstance[]>;
  getByDate(date: string): Observable<RoutineInstance[]>;
  getOrCreateForDate(routineId: string, date: string): Observable<RoutineInstance>;
  updateStatus(id: string, status: RoutineInstanceStatus): Observable<RoutineInstance>;
  updateScore(id: string, completionScore: number): Observable<RoutineInstance>;
  markOpened(id: string): Observable<RoutineInstance>;
  markClosed(id: string): Observable<RoutineInstance>;
  delete(id: string): Observable<boolean>;
}

export const ROUTINE_INSTANCE_REPOSITORY_TOKEN = new InjectionToken<IRoutineInstanceRepository>(
  'RoutineInstanceRepository',
);
