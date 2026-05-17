import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, from, of, switchMap, map } from 'rxjs';
import {
  ScheduledReminder,
  ReminderChannel,
  ReminderStatus,
  ReminderPreference,
  ScheduledReminderCreateRequest,
} from '../../models/reminder.model';
import { Routine, isDailySchedule, isWeeklySchedule, isMonthlySchedule } from '../../models/routine.model';
import { REMINDER_REPOSITORY_TOKEN } from '../interfaces/reminder-repository.interface';
import { ROUTINE_REPOSITORY_TOKEN } from '../interfaces/routine-repository.interface';
import { formatLocalDate } from '../utils/routine-schedule.utils';

interface NativeNotificationApi {
  schedule(opts: {
    notifications: Array<{
      id: number;
      title: string;
      body: string;
      schedule: { at: Date };
      extra?: Record<string, unknown>;
    }>;
  }): Promise<unknown>;
  cancel(opts: { notifications: Array<{ id: number }> }): Promise<unknown>;
  requestPermissions(): Promise<{ display: 'granted' | 'denied' | 'prompt' }>;
}

@Injectable({ providedIn: 'root' })
export class ScheduledReminderService {
  private readonly reminderRepo = inject(REMINDER_REPOSITORY_TOKEN);
  private readonly routineRepo = inject(ROUTINE_REPOSITORY_TOKEN);

  private nativePlugin: NativeNotificationApi | null = null;
  private nativeLoadAttempted = false;

  materializeForToday(): Observable<ScheduledReminder[]> {
    return this.materializeForDate(new Date());
  }

  materializeForDate(date: Date): Observable<ScheduledReminder[]> {
    return this.routineRepo.getAll().pipe(
      switchMap(routines => {
        const active = routines.filter(r => r.active && this.isScheduledOn(r, date));
        if (active.length === 0) return of([]);
        return this.reminderRepo.getPreferences().pipe(
          switchMap(prefs =>
            this.materializeBatch(active, prefs, date),
          ),
        );
      }),
    );
  }

  cancelForRoutine(routineId: string): Observable<boolean> {
    return this.reminderRepo.getScheduledByRoutine(routineId).pipe(
      switchMap(reminders => {
        if (reminders.length === 0) return of(true);
        const queued = reminders.filter(r => r.status === ReminderStatus.QUEUED);
        const cancels$ = queued.map(r => this.reminderRepo.cancelScheduled(r.id));
        const cancel$ = cancels$.length === 0 ? of([] as ScheduledReminder[]) : forkJoin(cancels$);
        return cancel$.pipe(
          switchMap(() => from(this.cancelNative(queued.map(r => r.id)))),
          map(() => true),
        );
      }),
    );
  }

  dispatchDue(): Observable<ScheduledReminder[]> {
    return this.reminderRepo.getDueScheduled(new Date()).pipe(
      switchMap(due => {
        if (due.length === 0) return of([]);
        const ops = due.map(r =>
          this.reminderRepo.updateScheduled(r.id, {
            status: ReminderStatus.SENT,
            sentAt: new Date(),
          }),
        );
        return forkJoin(ops);
      }),
    );
  }

  async requestPermission(): Promise<boolean> {
    const plugin = await this.loadNative();
    if (!plugin) {
      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
      return typeof Notification !== 'undefined' && Notification.permission === 'granted';
    }
    const result = await plugin.requestPermissions();
    return result.display === 'granted';
  }

  private materializeBatch(
    routines: Routine[],
    prefs: ReminderPreference[],
    date: Date,
  ): Observable<ScheduledReminder[]> {
    const dateStr = formatLocalDate(date);
    const ops: Observable<ScheduledReminder | null>[] = [];

    for (const routine of routines) {
      const pref = prefs.find(p => p.routineId === routine.id);
      if (!pref) continue;
      if (pref.muteUntil && pref.muteUntil > new Date()) continue;

      const sendAt = this.computeSendAt(routine, pref, date);
      if (!sendAt) continue;

      ops.push(
        this.reminderRepo.getScheduledByRoutine(routine.id).pipe(
          switchMap(existing => {
            const dupe = existing.find(
              r =>
                r.status === ReminderStatus.QUEUED &&
                formatLocalDate(r.sendAt) === dateStr,
            );
            if (dupe) return of(null);
            const channel = pref.channels[0] ?? ReminderChannel.LOCAL;
            const request: ScheduledReminderCreateRequest = {
              routineId: routine.id,
              sendAt,
              channel,
              payload: {
                title: routine.name,
                message: `Hora de tu rutina · ${routine.name}`,
              },
            };
            return this.reminderRepo.createScheduled(request).pipe(
              switchMap(reminder =>
                from(this.scheduleNative(reminder)).pipe(map(() => reminder)),
              ),
            );
          }),
        ),
      );
    }

    if (ops.length === 0) return of([]);
    return forkJoin(ops).pipe(map(list => list.filter((r): r is ScheduledReminder => r !== null)));
  }

  private computeSendAt(routine: Routine, pref: ReminderPreference, date: Date): Date | null {
    const cfg = routine.scheduleConfig;
    let timeWindow: string | undefined;
    if (isDailySchedule(cfg)) timeWindow = cfg.timeWindowStart;
    else if (isWeeklySchedule(cfg)) timeWindow = cfg.timeWindowStart;
    else if (isMonthlySchedule(cfg)) timeWindow = cfg.timeWindowStart;
    if (!timeWindow) return null;

    const [h, m] = timeWindow.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;

    const send = new Date(date);
    send.setHours(h, m, 0, 0);
    send.setMinutes(send.getMinutes() - pref.leadMinutes);
    return send;
  }

  private isScheduledOn(routine: Routine, date: Date): boolean {
    const cfg = routine.scheduleConfig;
    if (isDailySchedule(cfg)) return true;
    if (isWeeklySchedule(cfg)) return cfg.days.includes(date.getDay() as any);
    if (isMonthlySchedule(cfg)) return date.getDate() === cfg.dayOfMonth;
    return false;
  }

  private async loadNative(): Promise<NativeNotificationApi | null> {
    if (this.nativeLoadAttempted) return this.nativePlugin;
    this.nativeLoadAttempted = true;
    try {
      const mod = await import(/* @vite-ignore */ '@capacitor/local-notifications').catch(() => null);
      if (mod && typeof (mod as any).LocalNotifications?.schedule === 'function') {
        this.nativePlugin = (mod as any).LocalNotifications;
      }
    } catch {
      this.nativePlugin = null;
    }
    return this.nativePlugin;
  }

  private async scheduleNative(reminder: ScheduledReminder): Promise<void> {
    const plugin = await this.loadNative();
    if (!plugin) return;
    try {
      await plugin.schedule({
        notifications: [
          {
            id: this.numericId(reminder.id),
            title: reminder.payload.title,
            body: reminder.payload.message,
            schedule: { at: reminder.sendAt },
            extra: { reminderId: reminder.id, routineId: reminder.routineId },
          },
        ],
      });
    } catch (err) {
      console.warn('LocalNotifications.schedule failed', err);
    }
  }

  private async cancelNative(ids: string[]): Promise<void> {
    const plugin = await this.loadNative();
    if (!plugin || ids.length === 0) return;
    try {
      await plugin.cancel({
        notifications: ids.map(id => ({ id: this.numericId(id) })),
      });
    } catch (err) {
      console.warn('LocalNotifications.cancel failed', err);
    }
  }

  private numericId(stringId: string): number {
    let hash = 0;
    for (let i = 0; i < stringId.length; i++) {
      hash = ((hash << 5) - hash + stringId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }
}
