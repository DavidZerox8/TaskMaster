import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ITaskCompletionRepository } from '../interfaces/task-completion-repository.interface';
import { TaskCompletion } from '../../models/routine.model';

@Injectable({ providedIn: 'root' })
export class TaskCompletionLocalRepository implements ITaskCompletionRepository {
  private readonly KEY = 'task_completions';
  private readonly DELAY_MS = 100;
  private readonly USER_ID = 'local-user';

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private deserialize(raw: any): TaskCompletion {
    return {
      ...raw,
      completedAt: new Date(raw.completedAt),
    };
  }

  private getFromStorage(): TaskCompletion[] {
    const stored = localStorage.getItem(this.KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((c: any) => this.deserialize(c));
  }

  private saveToStorage(data: TaskCompletion[]): void {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  }

  getByInstance(routineInstanceId: string): Observable<TaskCompletion[]> {
    const completions = this.getFromStorage().filter(c => c.routineInstanceId === routineInstanceId);
    return of(completions).pipe(delay(this.DELAY_MS));
  }

  getByTask(taskId: string, from?: Date, to?: Date): Observable<TaskCompletion[]> {
    let completions = this.getFromStorage().filter(c => c.taskId === taskId);
    if (from) completions = completions.filter(c => c.completedAt >= from);
    if (to) completions = completions.filter(c => c.completedAt <= to);
    return of(completions).pipe(delay(this.DELAY_MS));
  }

  getAll(): Observable<TaskCompletion[]> {
    return of(this.getFromStorage()).pipe(delay(this.DELAY_MS));
  }

  add(
    partial: Partial<TaskCompletion> & { routineInstanceId: string; taskId: string },
  ): Observable<TaskCompletion> {
    const completions = this.getFromStorage();
    const newCompletion: TaskCompletion = {
      id: partial.id ?? this.generateId(),
      routineInstanceId: partial.routineInstanceId,
      taskId: partial.taskId,
      userId: partial.userId ?? this.USER_ID,
      completedAt: partial.completedAt ?? new Date(),
      durationSeconds: partial.durationSeconds,
      skipped: partial.skipped ?? false,
      note: partial.note,
    };
    completions.push(newCompletion);
    this.saveToStorage(completions);
    return of(newCompletion).pipe(delay(this.DELAY_MS));
  }

  update(id: string, partial: Partial<TaskCompletion>): Observable<TaskCompletion> {
    const completions = this.getFromStorage();
    const index = completions.findIndex(c => c.id === id);
    if (index === -1) {
      return throwError(() => new Error('Task completion not found'));
    }
    completions[index] = { ...completions[index], ...partial };
    this.saveToStorage(completions);
    return of(completions[index]).pipe(delay(this.DELAY_MS));
  }

  remove(id: string): Observable<boolean> {
    const completions = this.getFromStorage();
    const filtered = completions.filter(c => c.id !== id);
    if (filtered.length === completions.length) {
      return throwError(() => new Error('Task completion not found'));
    }
    this.saveToStorage(filtered);
    return of(true).pipe(delay(this.DELAY_MS));
  }

  removeByInstanceAndTask(routineInstanceId: string, taskId: string): Observable<boolean> {
    const completions = this.getFromStorage();
    const filtered = completions.filter(
      c => !(c.routineInstanceId === routineInstanceId && c.taskId === taskId),
    );
    if (filtered.length === completions.length) {
      return of(false).pipe(delay(this.DELAY_MS));
    }
    this.saveToStorage(filtered);
    return of(true).pipe(delay(this.DELAY_MS));
  }
}
