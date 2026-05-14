import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { IAdaptiveSuggestionRepository } from '../interfaces/adaptive-suggestion-repository.interface';
import {
  AdaptiveSuggestion,
  AdaptiveSuggestionCreateRequest,
  AdaptiveSuggestionStatus,
  AdaptiveSuggestionType,
  AdaptiveSuggestionUpdateRequest,
} from '../../models/adaptive.model';

@Injectable({ providedIn: 'root' })
export class AdaptiveSuggestionLocalRepository implements IAdaptiveSuggestionRepository {
  private readonly KEY = 'adaptive_suggestions';
  private readonly DELAY_MS = 60;
  private readonly USER_ID = 'local-user';

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private deserialize(raw: any): AdaptiveSuggestion {
    return {
      ...raw,
      createdAt: new Date(raw.createdAt),
      resolvedAt: raw.resolvedAt ? new Date(raw.resolvedAt) : undefined,
    };
  }

  private load(): AdaptiveSuggestion[] {
    const stored = localStorage.getItem(this.KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored).map((r: any) => this.deserialize(r));
    } catch {
      return [];
    }
  }

  private save(data: AdaptiveSuggestion[]): void {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  }

  getAll(status?: AdaptiveSuggestionStatus): Observable<AdaptiveSuggestion[]> {
    let list = this.load();
    if (status) list = list.filter(s => s.status === status);
    return of(list).pipe(delay(this.DELAY_MS));
  }

  getByRoutine(
    routineId: string,
    status?: AdaptiveSuggestionStatus,
  ): Observable<AdaptiveSuggestion[]> {
    let list = this.load().filter(s => s.routineId === routineId);
    if (status) list = list.filter(s => s.status === status);
    return of(list).pipe(delay(this.DELAY_MS));
  }

  getById(id: string): Observable<AdaptiveSuggestion | null> {
    const found = this.load().find(s => s.id === id) ?? null;
    return of(found).pipe(delay(this.DELAY_MS));
  }

  create(request: AdaptiveSuggestionCreateRequest): Observable<AdaptiveSuggestion> {
    const list = this.load();
    const created: AdaptiveSuggestion = {
      id: this.generateId(),
      userId: this.USER_ID,
      routineId: request.routineId,
      type: request.type,
      payload: request.payload,
      status: AdaptiveSuggestionStatus.PROPOSED,
      createdAt: new Date(),
    };
    list.push(created);
    this.save(list);
    return of(created).pipe(delay(this.DELAY_MS));
  }

  update(id: string, request: AdaptiveSuggestionUpdateRequest): Observable<AdaptiveSuggestion> {
    const list = this.load();
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) {
      return throwError(() => new Error('Adaptive suggestion not found'));
    }
    list[idx] = {
      ...list[idx],
      status: request.status ?? list[idx].status,
      resolvedAt: request.resolvedAt ?? list[idx].resolvedAt,
      appliedSnapshot: request.appliedSnapshot ?? list[idx].appliedSnapshot,
    };
    this.save(list);
    return of(list[idx]).pipe(delay(this.DELAY_MS));
  }

  delete(id: string): Observable<boolean> {
    const list = this.load();
    const filtered = list.filter(s => s.id !== id);
    if (filtered.length === list.length) {
      return throwError(() => new Error('Adaptive suggestion not found'));
    }
    this.save(filtered);
    return of(true).pipe(delay(this.DELAY_MS));
  }

  hasOpenForRoutineAndType(
    routineId: string,
    type: AdaptiveSuggestionType,
  ): Observable<boolean> {
    const open = this.load().some(
      s =>
        s.routineId === routineId &&
        s.type === type &&
        s.status === AdaptiveSuggestionStatus.PROPOSED,
    );
    return of(open).pipe(delay(this.DELAY_MS));
  }
}
