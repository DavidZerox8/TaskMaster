import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { TaskCompletion } from '../../models/routine.model';

export interface ITaskCompletionRepository {
  getByInstance(routineInstanceId: string): Observable<TaskCompletion[]>;
  getByTask(taskId: string, from?: Date, to?: Date): Observable<TaskCompletion[]>;
  getAll(): Observable<TaskCompletion[]>;
  add(partial: Partial<TaskCompletion> & { routineInstanceId: string; taskId: string }): Observable<TaskCompletion>;
  update(id: string, partial: Partial<TaskCompletion>): Observable<TaskCompletion>;
  remove(id: string): Observable<boolean>;
  removeByInstanceAndTask(routineInstanceId: string, taskId: string): Observable<boolean>;
}

export const TASK_COMPLETION_REPOSITORY_TOKEN = new InjectionToken<ITaskCompletionRepository>(
  'TaskCompletionRepository',
);
