import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { IRoutineInstanceRepository } from '../interfaces/routine-instance-repository.interface';
import { RoutineInstance, RoutineInstanceStatus } from '../../models/routine.model';

@Injectable({ providedIn: 'root' })
export class RoutineInstanceLocalRepository implements IRoutineInstanceRepository {
  private readonly KEY = 'routine_instances';
  private readonly DELAY_MS = 100;
  private readonly USER_ID = 'local-user';

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private getFromStorage(): RoutineInstance[] {
    const stored = localStorage.getItem(this.KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((r: any) => this.deserialize(r));
  }

  private saveToStorage(data: RoutineInstance[]): void {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  }

  private deserialize(raw: any): RoutineInstance {
    return {
      ...raw,
      openedAt: raw.openedAt ? new Date(raw.openedAt) : undefined,
      closedAt: raw.closedAt ? new Date(raw.closedAt) : undefined,
    };
  }

  getAll(): Observable<RoutineInstance[]> {
    return of(this.getFromStorage()).pipe(delay(this.DELAY_MS));
  }

  getById(id: string): Observable<RoutineInstance | null> {
    const instances = this.getFromStorage();
    return of(instances.find(i => i.id === id) ?? null).pipe(delay(this.DELAY_MS));
  }

  getByRoutine(routineId: string, from?: Date, to?: Date): Observable<RoutineInstance[]> {
    let instances = this.getFromStorage().filter(i => i.routineId === routineId);
    if (from) {
      const fromStr = this.formatDate(from);
      instances = instances.filter(i => i.date >= fromStr);
    }
    if (to) {
      const toStr = this.formatDate(to);
      instances = instances.filter(i => i.date <= toStr);
    }
    return of(instances).pipe(delay(this.DELAY_MS));
  }

  getByDate(date: string): Observable<RoutineInstance[]> {
    const instances = this.getFromStorage().filter(i => i.date === date);
    return of(instances).pipe(delay(this.DELAY_MS));
  }

  getOrCreateForDate(routineId: string, date: string): Observable<RoutineInstance> {
    const instances = this.getFromStorage();
    const existing = instances.find(i => i.routineId === routineId && i.date === date);
    if (existing) {
      return of(existing).pipe(delay(this.DELAY_MS));
    }
    const newInstance: RoutineInstance = {
      id: this.generateId(),
      routineId,
      userId: this.USER_ID,
      date,
      status: RoutineInstanceStatus.PENDING,
      completionScore: 0,
    };
    instances.push(newInstance);
    this.saveToStorage(instances);
    return of(newInstance).pipe(delay(this.DELAY_MS));
  }

  updateStatus(id: string, status: RoutineInstanceStatus): Observable<RoutineInstance> {
    const instances = this.getFromStorage();
    const index = instances.findIndex(i => i.id === id);
    if (index === -1) {
      return throwError(() => new Error('Routine instance not found'));
    }
    instances[index] = { ...instances[index], status };
    this.saveToStorage(instances);
    return of(instances[index]).pipe(delay(this.DELAY_MS));
  }

  updateScore(id: string, completionScore: number): Observable<RoutineInstance> {
    const instances = this.getFromStorage();
    const index = instances.findIndex(i => i.id === id);
    if (index === -1) {
      return throwError(() => new Error('Routine instance not found'));
    }
    instances[index] = {
      ...instances[index],
      completionScore: Math.max(0, Math.min(100, completionScore)),
    };
    this.saveToStorage(instances);
    return of(instances[index]).pipe(delay(this.DELAY_MS));
  }

  markOpened(id: string): Observable<RoutineInstance> {
    const instances = this.getFromStorage();
    const index = instances.findIndex(i => i.id === id);
    if (index === -1) {
      return throwError(() => new Error('Routine instance not found'));
    }
    const current = instances[index];
    instances[index] = {
      ...current,
      openedAt: current.openedAt ?? new Date(),
      status:
        current.status === RoutineInstanceStatus.PENDING
          ? RoutineInstanceStatus.IN_PROGRESS
          : current.status,
    };
    this.saveToStorage(instances);
    return of(instances[index]).pipe(delay(this.DELAY_MS));
  }

  markClosed(id: string): Observable<RoutineInstance> {
    const instances = this.getFromStorage();
    const index = instances.findIndex(i => i.id === id);
    if (index === -1) {
      return throwError(() => new Error('Routine instance not found'));
    }
    instances[index] = { ...instances[index], closedAt: new Date() };
    this.saveToStorage(instances);
    return of(instances[index]).pipe(delay(this.DELAY_MS));
  }

  delete(id: string): Observable<boolean> {
    const instances = this.getFromStorage();
    const filtered = instances.filter(i => i.id !== id);
    if (filtered.length === instances.length) {
      return throwError(() => new Error('Routine instance not found'));
    }
    this.saveToStorage(filtered);
    return of(true).pipe(delay(this.DELAY_MS));
  }

  private formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
