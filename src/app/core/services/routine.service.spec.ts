import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { RoutineService } from './routine.service';
import { APP_REPOSITORY_PROVIDERS } from '../providers/app.providers';
import { ScheduleType } from '../../models/routine.model';
import { DayOfWeek } from '../../models/habit.model';

describe('RoutineService', () => {
  let service: RoutineService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [...APP_REPOSITORY_PROVIDERS],
    });
    service = TestBed.inject(RoutineService);
  });

  afterEach(() => localStorage.clear());

  it('creates routine with tasks and updates signals', async () => {
    const routine = await firstValueFrom(
      service.create({
        name: 'Morning',
        scheduleType: ScheduleType.DAILY,
        scheduleConfig: { type: 'daily', timeWindowStart: '07:00' },
        tasks: [
          { name: 'Stretch', order: 0 },
          { name: 'Hydrate', order: 1 },
        ],
      }),
    );
    expect(routine.id).toBeTruthy();
    expect(service.routines().length).toBe(1);
    // wait microtask for tasks subscription
    await new Promise(r => setTimeout(r, 150));
    expect(service.getRoutineTasks(routine.id).length).toBe(2);
  });

  it('exposes activeRoutines computed signal', async () => {
    const r1 = await firstValueFrom(
      service.create({
        name: 'A',
        scheduleType: ScheduleType.DAILY,
        scheduleConfig: { type: 'daily' },
      }),
    );
    await firstValueFrom(
      service.create({
        name: 'B',
        scheduleType: ScheduleType.DAILY,
        scheduleConfig: { type: 'daily' },
      }),
    );
    expect(service.activeRoutines().length).toBe(2);
    await firstValueFrom(service.archive(r1.id));
    expect(service.activeRoutines().length).toBe(1);
  });

  it('todayRoutines filters by weekly schedule', async () => {
    const today = new Date().getDay() as DayOfWeek;
    const inactiveDay: DayOfWeek = ((today + 1) % 7) as DayOfWeek;
    await firstValueFrom(
      service.create({
        name: 'OnToday',
        scheduleType: ScheduleType.WEEKLY,
        scheduleConfig: { type: 'weekly', days: [today] },
      }),
    );
    await firstValueFrom(
      service.create({
        name: 'NotToday',
        scheduleType: ScheduleType.WEEKLY,
        scheduleConfig: { type: 'weekly', days: [inactiveDay] },
      }),
    );
    const today_ = service.todayRoutines();
    expect(today_.map(r => r.name)).toContain('OnToday');
    expect(today_.map(r => r.name)).not.toContain('NotToday');
  });

  it('reorderTasks updates task order', async () => {
    const routine = await firstValueFrom(
      service.create({
        name: 'R',
        scheduleType: ScheduleType.DAILY,
        scheduleConfig: { type: 'daily' },
        tasks: [
          { name: 'one', order: 0 },
          { name: 'two', order: 1 },
          { name: 'three', order: 2 },
        ],
      }),
    );
    await new Promise(r => setTimeout(r, 150));
    const tasks = service.getRoutineTasks(routine.id);
    await firstValueFrom(
      service.reorderTasks(routine.id, [tasks[2].id, tasks[0].id, tasks[1].id]),
    );
    const reordered = service.getRoutineTasks(routine.id);
    expect(reordered.map(t => t.name)).toEqual(['three', 'one', 'two']);
  });

  it('delete removes routine + tasks from signals', async () => {
    const routine = await firstValueFrom(
      service.create({
        name: 'X',
        scheduleType: ScheduleType.DAILY,
        scheduleConfig: { type: 'daily' },
        tasks: [{ name: 't', order: 0 }],
      }),
    );
    await new Promise(r => setTimeout(r, 150));
    await firstValueFrom(service.delete(routine.id));
    expect(service.routines().length).toBe(0);
    expect(service.getRoutineTasks(routine.id).length).toBe(0);
  });
});
