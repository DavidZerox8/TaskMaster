import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ScheduledReminderService } from './scheduled-reminder.service';
import { RoutineService } from './routine.service';
import { APP_REPOSITORY_PROVIDERS } from '../providers/app.providers';
import { REMINDER_REPOSITORY_TOKEN } from '../interfaces/reminder-repository.interface';
import {
  ReminderChannel,
  ReminderStatus,
} from '../../models/reminder.model';
import { ScheduleType } from '../../models/routine.model';

describe('ScheduledReminderService', () => {
  let service: ScheduledReminderService;
  let routineService: RoutineService;
  let reminderRepo: ReturnType<typeof TestBed.inject<typeof REMINDER_REPOSITORY_TOKEN>>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [...APP_REPOSITORY_PROVIDERS] });
    service = TestBed.inject(ScheduledReminderService);
    routineService = TestBed.inject(RoutineService);
    reminderRepo = TestBed.inject(REMINDER_REPOSITORY_TOKEN);
  });

  afterEach(() => localStorage.clear());

  async function seedRoutineWithPrefs() {
    const future = new Date();
    future.setHours(future.getHours() + 3);
    const hh = String(future.getHours()).padStart(2, '0');
    const mm = String(future.getMinutes()).padStart(2, '0');
    const routine = await firstValueFrom(
      routineService.create({
        name: 'Stretching',
        scheduleType: ScheduleType.DAILY,
        scheduleConfig: { type: 'daily', timeWindowStart: `${hh}:${mm}` },
      }),
    );
    await firstValueFrom(
      reminderRepo.createPreference({
        routineId: routine.id,
        channels: [ReminderChannel.LOCAL],
        leadMinutes: 10,
      }),
    );
    return routine;
  }

  it('materializes reminders for active routines with preferences', async () => {
    await seedRoutineWithPrefs();
    const reminders = await firstValueFrom(service.materializeForToday());
    expect(reminders.length).toBe(1);
    expect(reminders[0].status).toBe(ReminderStatus.QUEUED);
    expect(reminders[0].channel).toBe(ReminderChannel.LOCAL);
  });

  it('is idempotent — second call does not duplicate', async () => {
    await seedRoutineWithPrefs();
    await firstValueFrom(service.materializeForToday());
    const second = await firstValueFrom(service.materializeForToday());
    expect(second.length).toBe(0);
    const all = await firstValueFrom(reminderRepo.getScheduled());
    expect(all.length).toBe(1);
  });

  it('skips routines without time window', async () => {
    const routine = await firstValueFrom(
      routineService.create({
        name: 'No window',
        scheduleType: ScheduleType.DAILY,
        scheduleConfig: { type: 'daily' },
      }),
    );
    await firstValueFrom(
      reminderRepo.createPreference({
        routineId: routine.id,
        channels: [ReminderChannel.LOCAL],
        leadMinutes: 5,
      }),
    );
    const reminders = await firstValueFrom(service.materializeForToday());
    expect(reminders.length).toBe(0);
  });

  it('respects muteUntil — no reminder created while muted', async () => {
    const future = new Date();
    future.setHours(future.getHours() + 3);
    const hh = String(future.getHours()).padStart(2, '0');
    const mm = String(future.getMinutes()).padStart(2, '0');
    const routine = await firstValueFrom(
      routineService.create({
        name: 'Mutable',
        scheduleType: ScheduleType.DAILY,
        scheduleConfig: { type: 'daily', timeWindowStart: `${hh}:${mm}` },
      }),
    );
    const muteFuture = new Date();
    muteFuture.setDate(muteFuture.getDate() + 1);
    await firstValueFrom(
      reminderRepo.createPreference({
        routineId: routine.id,
        channels: [ReminderChannel.LOCAL],
        leadMinutes: 0,
        muteUntil: muteFuture,
      }),
    );
    const reminders = await firstValueFrom(service.materializeForToday());
    expect(reminders.length).toBe(0);
  });

  it('cancelForRoutine marks queued reminders cancelled', async () => {
    const routine = await seedRoutineWithPrefs();
    await firstValueFrom(service.materializeForToday());
    await firstValueFrom(service.cancelForRoutine(routine.id));
    const all = await firstValueFrom(reminderRepo.getScheduledByRoutine(routine.id));
    expect(all.every(r => r.status === ReminderStatus.CANCELLED)).toBeTrue();
  });

  it('dispatchDue marks past reminders as sent', async () => {
    const routine = await seedRoutineWithPrefs();
    const past = new Date();
    past.setMinutes(past.getMinutes() - 5);
    await firstValueFrom(
      reminderRepo.createScheduled({
        routineId: routine.id,
        sendAt: past,
        channel: ReminderChannel.LOCAL,
        payload: { title: 'Test', message: 'Past reminder' },
      }),
    );
    const dispatched = await firstValueFrom(service.dispatchDue());
    expect(dispatched.length).toBeGreaterThanOrEqual(1);
    expect(dispatched.every(r => r.status === ReminderStatus.SENT)).toBeTrue();
    expect(dispatched.every(r => r.sentAt !== undefined)).toBeTrue();
  });
});
