import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { IReminderRepository } from '../interfaces/reminder-repository.interface';
import {
  ReminderPreference,
  ReminderPreferenceCreateRequest,
  ReminderPreferenceUpdateRequest,
  ScheduledReminder,
  ScheduledReminderCreateRequest,
  ScheduledReminderUpdateRequest,
  ReminderStatus,
} from '../../models/reminder.model';

@Injectable({ providedIn: 'root' })
export class ReminderLocalRepository implements IReminderRepository {
  private readonly PREFS_KEY = 'reminder_preferences';
  private readonly SCHEDULED_KEY = 'scheduled_reminders';
  private readonly DELAY_MS = 100;
  private readonly USER_ID = 'local-user';

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private deserializePref(raw: any): ReminderPreference {
    return {
      ...raw,
      muteUntil: raw.muteUntil ? new Date(raw.muteUntil) : undefined,
    };
  }

  private deserializeScheduled(raw: any): ScheduledReminder {
    return {
      ...raw,
      sendAt: new Date(raw.sendAt),
      sentAt: raw.sentAt ? new Date(raw.sentAt) : undefined,
    };
  }

  private loadPrefs(): ReminderPreference[] {
    const stored = localStorage.getItem(this.PREFS_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((p: any) => this.deserializePref(p));
  }

  private savePrefs(data: ReminderPreference[]): void {
    localStorage.setItem(this.PREFS_KEY, JSON.stringify(data));
  }

  private loadScheduled(): ScheduledReminder[] {
    const stored = localStorage.getItem(this.SCHEDULED_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((r: any) => this.deserializeScheduled(r));
  }

  private saveScheduled(data: ScheduledReminder[]): void {
    localStorage.setItem(this.SCHEDULED_KEY, JSON.stringify(data));
  }

  getPreferences(): Observable<ReminderPreference[]> {
    return of(this.loadPrefs()).pipe(delay(this.DELAY_MS));
  }

  getPreferenceByRoutine(routineId: string): Observable<ReminderPreference | null> {
    const prefs = this.loadPrefs();
    return of(prefs.find(p => p.routineId === routineId) ?? null).pipe(delay(this.DELAY_MS));
  }

  createPreference(request: ReminderPreferenceCreateRequest): Observable<ReminderPreference> {
    const prefs = this.loadPrefs();
    const newPref: ReminderPreference = {
      id: this.generateId(),
      userId: this.USER_ID,
      routineId: request.routineId,
      channels: request.channels,
      leadMinutes: request.leadMinutes,
      muteUntil: request.muteUntil,
    };
    prefs.push(newPref);
    this.savePrefs(prefs);
    return of(newPref).pipe(delay(this.DELAY_MS));
  }

  updatePreference(
    id: string,
    request: ReminderPreferenceUpdateRequest,
  ): Observable<ReminderPreference> {
    const prefs = this.loadPrefs();
    const index = prefs.findIndex(p => p.id === id);
    if (index === -1) {
      return throwError(() => new Error('Reminder preference not found'));
    }
    const current = prefs[index];
    prefs[index] = {
      ...current,
      channels: request.channels ?? current.channels,
      leadMinutes: request.leadMinutes ?? current.leadMinutes,
      muteUntil: request.muteUntil === null ? undefined : request.muteUntil ?? current.muteUntil,
    };
    this.savePrefs(prefs);
    return of(prefs[index]).pipe(delay(this.DELAY_MS));
  }

  deletePreference(id: string): Observable<boolean> {
    const prefs = this.loadPrefs();
    const filtered = prefs.filter(p => p.id !== id);
    if (filtered.length === prefs.length) {
      return throwError(() => new Error('Reminder preference not found'));
    }
    this.savePrefs(filtered);
    return of(true).pipe(delay(this.DELAY_MS));
  }

  getScheduled(status?: ReminderStatus): Observable<ScheduledReminder[]> {
    let scheduled = this.loadScheduled();
    if (status) scheduled = scheduled.filter(s => s.status === status);
    return of(scheduled).pipe(delay(this.DELAY_MS));
  }

  getScheduledByRoutine(routineId: string): Observable<ScheduledReminder[]> {
    const scheduled = this.loadScheduled().filter(s => s.routineId === routineId);
    return of(scheduled).pipe(delay(this.DELAY_MS));
  }

  getDueScheduled(now: Date): Observable<ScheduledReminder[]> {
    const due = this.loadScheduled().filter(
      s => s.status === ReminderStatus.QUEUED && s.sendAt <= now,
    );
    return of(due).pipe(delay(this.DELAY_MS));
  }

  createScheduled(request: ScheduledReminderCreateRequest): Observable<ScheduledReminder> {
    const scheduled = this.loadScheduled();
    const newReminder: ScheduledReminder = {
      id: this.generateId(),
      userId: this.USER_ID,
      routineId: request.routineId,
      routineInstanceId: request.routineInstanceId,
      sendAt: request.sendAt,
      channel: request.channel,
      status: ReminderStatus.QUEUED,
      payload: request.payload,
    };
    scheduled.push(newReminder);
    this.saveScheduled(scheduled);
    return of(newReminder).pipe(delay(this.DELAY_MS));
  }

  updateScheduled(
    id: string,
    request: ScheduledReminderUpdateRequest,
  ): Observable<ScheduledReminder> {
    const scheduled = this.loadScheduled();
    const index = scheduled.findIndex(s => s.id === id);
    if (index === -1) {
      return throwError(() => new Error('Scheduled reminder not found'));
    }
    scheduled[index] = { ...scheduled[index], ...request };
    this.saveScheduled(scheduled);
    return of(scheduled[index]).pipe(delay(this.DELAY_MS));
  }

  cancelScheduled(id: string): Observable<ScheduledReminder> {
    return this.updateScheduled(id, { status: ReminderStatus.CANCELLED });
  }

  deleteScheduled(id: string): Observable<boolean> {
    const scheduled = this.loadScheduled();
    const filtered = scheduled.filter(s => s.id !== id);
    if (filtered.length === scheduled.length) {
      return throwError(() => new Error('Scheduled reminder not found'));
    }
    this.saveScheduled(filtered);
    return of(true).pipe(delay(this.DELAY_MS));
  }
}
