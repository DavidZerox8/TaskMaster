import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { IBehaviorRepository } from '../interfaces/behavior-repository.interface';
import {
  UserBehaviorEvent,
  UserBehaviorEventInput,
  isBehaviorEventType,
} from '../../models/behavior.model';

@Injectable({ providedIn: 'root' })
export class BehaviorLocalRepository implements IBehaviorRepository {
  private readonly KEY = 'behavior_events';
  private readonly DELAY_MS = 100;
  private readonly USER_ID = 'local-user';
  private readonly RETENTION_DAYS = 90;

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private deserialize(raw: any): UserBehaviorEvent {
    return { ...raw, occurredAt: new Date(raw.occurredAt) };
  }

  private getFromStorage(): UserBehaviorEvent[] {
    const stored = localStorage.getItem(this.KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((e: any) => this.deserialize(e));
  }

  private saveToStorage(data: UserBehaviorEvent[]): void {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  }

  private retentionCutoff(): Date {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.RETENTION_DAYS);
    return cutoff;
  }

  getAll(from?: Date, to?: Date): Observable<UserBehaviorEvent[]> {
    let events = this.getFromStorage();
    if (from) events = events.filter(e => e.occurredAt >= from);
    if (to) events = events.filter(e => e.occurredAt <= to);
    return of(events).pipe(delay(this.DELAY_MS));
  }

  appendBatch(inputs: UserBehaviorEventInput[]): Observable<UserBehaviorEvent[]> {
    const valid = inputs.filter(i => isBehaviorEventType(i.eventType));
    const events = this.getFromStorage();
    const cutoff = this.retentionCutoff();
    const pruned = events.filter(e => e.occurredAt >= cutoff);

    const added: UserBehaviorEvent[] = valid.map(i => ({
      id: this.generateId(),
      userId: this.USER_ID,
      eventType: i.eventType,
      eventData: i.eventData ?? {},
      occurredAt: i.occurredAt ?? new Date(),
    }));
    pruned.push(...added);
    this.saveToStorage(pruned);
    return of(added).pipe(delay(this.DELAY_MS));
  }

  pruneOlderThan(date: Date): Observable<number> {
    const events = this.getFromStorage();
    const kept = events.filter(e => e.occurredAt >= date);
    const removed = events.length - kept.length;
    this.saveToStorage(kept);
    return of(removed).pipe(delay(this.DELAY_MS));
  }

  clear(): Observable<boolean> {
    localStorage.removeItem(this.KEY);
    return of(true).pipe(delay(this.DELAY_MS));
  }
}
