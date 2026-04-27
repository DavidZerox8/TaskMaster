import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { IRoutineRepository } from '../interfaces/routine-repository.interface';
import {
  Routine,
  RoutineCreateRequest,
  RoutineUpdateRequest,
  RoutineFilters,
  Task,
  TaskCreateRequest,
  TaskUpdateRequest,
} from '../../models/routine.model';

@Injectable({ providedIn: 'root' })
export class RoutineLocalRepository implements IRoutineRepository {
  private readonly ROUTINES_KEY = 'routines';
  private readonly TASKS_KEY = 'routine_tasks';
  private readonly DELAY_MS = 100;
  private readonly USER_ID = 'local-user';

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private getFromStorage<T>(key: string): T[] {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    return JSON.parse(stored);
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private deserializeRoutine(raw: any): Routine {
    return {
      ...raw,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
  }

  private loadRoutines(): Routine[] {
    return this.getFromStorage<any>(this.ROUTINES_KEY).map(r => this.deserializeRoutine(r));
  }

  private loadTasks(): Task[] {
    return this.getFromStorage<Task>(this.TASKS_KEY);
  }

  private applyFilters(routines: Routine[], filters?: RoutineFilters): Routine[] {
    if (!filters) return routines;
    return routines.filter(r => {
      if (filters.active !== undefined && r.active !== filters.active) return false;
      if (filters.scheduleType && r.scheduleType !== filters.scheduleType) return false;
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matchName = r.name.toLowerCase().includes(search);
        const matchDesc = r.description?.toLowerCase().includes(search);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }

  getAll(filters?: RoutineFilters): Observable<Routine[]> {
    const routines = this.loadRoutines();
    return of(this.applyFilters(routines, filters)).pipe(delay(this.DELAY_MS));
  }

  getById(id: string): Observable<Routine | null> {
    const routines = this.loadRoutines();
    return of(routines.find(r => r.id === id) ?? null).pipe(delay(this.DELAY_MS));
  }

  create(request: RoutineCreateRequest): Observable<Routine> {
    const routines = this.loadRoutines();
    const now = new Date();
    const newRoutine: Routine = {
      id: this.generateId(),
      userId: this.USER_ID,
      name: request.name,
      description: request.description,
      color: request.color ?? '#6366f1',
      icon: request.icon,
      scheduleType: request.scheduleType,
      scheduleConfig: request.scheduleConfig,
      active: true,
      sort: request.sort ?? routines.length,
      createdAt: now,
      updatedAt: now,
    };
    routines.push(newRoutine);
    this.saveToStorage(this.ROUTINES_KEY, routines);

    if (request.tasks?.length) {
      const tasks = this.loadTasks();
      const newTasks: Task[] = request.tasks.map(t => ({
        id: this.generateId(),
        routineId: newRoutine.id,
        name: t.name,
        description: t.description,
        order: t.order,
        defaultDurationMinutes: t.defaultDurationMinutes,
        suggestedTimeOfDay: t.suggestedTimeOfDay,
      }));
      tasks.push(...newTasks);
      this.saveToStorage(this.TASKS_KEY, tasks);
    }

    return of(newRoutine).pipe(delay(this.DELAY_MS));
  }

  update(id: string, request: RoutineUpdateRequest): Observable<Routine> {
    const routines = this.loadRoutines();
    const index = routines.findIndex(r => r.id === id);
    if (index === -1) {
      return throwError(() => new Error('Routine not found'));
    }
    routines[index] = { ...routines[index], ...request, updatedAt: new Date() };
    this.saveToStorage(this.ROUTINES_KEY, routines);
    return of(routines[index]).pipe(delay(this.DELAY_MS));
  }

  delete(id: string): Observable<boolean> {
    const routines = this.loadRoutines();
    const filtered = routines.filter(r => r.id !== id);
    if (filtered.length === routines.length) {
      return throwError(() => new Error('Routine not found'));
    }
    this.saveToStorage(this.ROUTINES_KEY, filtered);
    const tasks = this.loadTasks().filter(t => t.routineId !== id);
    this.saveToStorage(this.TASKS_KEY, tasks);
    return of(true).pipe(delay(this.DELAY_MS));
  }

  getTasks(routineId: string): Observable<Task[]> {
    const tasks = this.loadTasks()
      .filter(t => t.routineId === routineId)
      .sort((a, b) => a.order - b.order);
    return of(tasks).pipe(delay(this.DELAY_MS));
  }

  getAllTasks(): Observable<Task[]> {
    return of(this.loadTasks()).pipe(delay(this.DELAY_MS));
  }

  addTask(routineId: string, request: TaskCreateRequest): Observable<Task> {
    const routines = this.loadRoutines();
    if (!routines.some(r => r.id === routineId)) {
      return throwError(() => new Error('Routine not found'));
    }
    const tasks = this.loadTasks();
    const newTask: Task = {
      id: this.generateId(),
      routineId,
      name: request.name,
      description: request.description,
      order: request.order,
      defaultDurationMinutes: request.defaultDurationMinutes,
      suggestedTimeOfDay: request.suggestedTimeOfDay,
    };
    tasks.push(newTask);
    this.saveToStorage(this.TASKS_KEY, tasks);
    return of(newTask).pipe(delay(this.DELAY_MS));
  }

  updateTask(taskId: string, request: TaskUpdateRequest): Observable<Task> {
    const tasks = this.loadTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) {
      return throwError(() => new Error('Task not found'));
    }
    tasks[index] = { ...tasks[index], ...request };
    this.saveToStorage(this.TASKS_KEY, tasks);
    return of(tasks[index]).pipe(delay(this.DELAY_MS));
  }

  deleteTask(taskId: string): Observable<boolean> {
    const tasks = this.loadTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    if (filtered.length === tasks.length) {
      return throwError(() => new Error('Task not found'));
    }
    this.saveToStorage(this.TASKS_KEY, filtered);
    return of(true).pipe(delay(this.DELAY_MS));
  }

  reorderTasks(routineId: string, orderedIds: string[]): Observable<Task[]> {
    const tasks = this.loadTasks();
    const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
    const updated = tasks.map(t =>
      t.routineId === routineId && orderMap.has(t.id)
        ? { ...t, order: orderMap.get(t.id)! }
        : t,
    );
    this.saveToStorage(this.TASKS_KEY, updated);
    const reordered = updated
      .filter(t => t.routineId === routineId)
      .sort((a, b) => a.order - b.order);
    return of(reordered).pipe(delay(this.DELAY_MS));
  }
}
