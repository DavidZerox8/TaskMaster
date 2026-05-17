import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Routine,
  RoutineCreateRequest,
  RoutineUpdateRequest,
  RoutineFilters,
  Task,
  TaskCreateRequest,
  TaskUpdateRequest,
} from '../../models/routine.model';

export interface IRoutineRepository {
  getAll(filters?: RoutineFilters): Observable<Routine[]>;
  getById(id: string): Observable<Routine | null>;
  create(request: RoutineCreateRequest): Observable<Routine>;
  update(id: string, request: RoutineUpdateRequest): Observable<Routine>;
  delete(id: string): Observable<boolean>;
  getTasks(routineId: string): Observable<Task[]>;
  getAllTasks(): Observable<Task[]>;
  addTask(routineId: string, request: TaskCreateRequest): Observable<Task>;
  updateTask(taskId: string, request: TaskUpdateRequest): Observable<Task>;
  deleteTask(taskId: string): Observable<boolean>;
  reorderTasks(routineId: string, orderedIds: string[]): Observable<Task[]>;
}

export const ROUTINE_REPOSITORY_TOKEN = new InjectionToken<IRoutineRepository>('RoutineRepository');
