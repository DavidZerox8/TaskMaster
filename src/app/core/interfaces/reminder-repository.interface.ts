import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ReminderPreference,
  ReminderPreferenceCreateRequest,
  ReminderPreferenceUpdateRequest,
  ScheduledReminder,
  ScheduledReminderCreateRequest,
  ScheduledReminderUpdateRequest,
  ReminderStatus,
} from '../../models/reminder.model';

export interface IReminderRepository {
  getPreferences(): Observable<ReminderPreference[]>;
  getPreferenceByRoutine(routineId: string): Observable<ReminderPreference | null>;
  createPreference(request: ReminderPreferenceCreateRequest): Observable<ReminderPreference>;
  updatePreference(id: string, request: ReminderPreferenceUpdateRequest): Observable<ReminderPreference>;
  deletePreference(id: string): Observable<boolean>;

  getScheduled(status?: ReminderStatus): Observable<ScheduledReminder[]>;
  getScheduledByRoutine(routineId: string): Observable<ScheduledReminder[]>;
  getDueScheduled(now: Date): Observable<ScheduledReminder[]>;
  createScheduled(request: ScheduledReminderCreateRequest): Observable<ScheduledReminder>;
  updateScheduled(id: string, request: ScheduledReminderUpdateRequest): Observable<ScheduledReminder>;
  cancelScheduled(id: string): Observable<ScheduledReminder>;
  deleteScheduled(id: string): Observable<boolean>;
}

export const REMINDER_REPOSITORY_TOKEN = new InjectionToken<IReminderRepository>('ReminderRepository');
