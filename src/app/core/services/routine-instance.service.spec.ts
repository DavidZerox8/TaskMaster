import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { RoutineService } from './routine.service';
import { RoutineInstanceService } from './routine-instance.service';
import { APP_REPOSITORY_PROVIDERS } from '../providers/app.providers';
import { ScheduleType, RoutineInstanceStatus } from '../../models/routine.model';
import { formatLocalDate } from '../utils/routine-schedule.utils';

describe('RoutineInstanceService', () => {
  let routineService: RoutineService;
  let instanceService: RoutineInstanceService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [...APP_REPOSITORY_PROVIDERS],
    });
    routineService = TestBed.inject(RoutineService);
    instanceService = TestBed.inject(RoutineInstanceService);
  });

  afterEach(() => localStorage.clear());

  async function createRoutine(taskCount: number) {
    const routine = await firstValueFrom(
      routineService.create({
        name: 'R',
        scheduleType: ScheduleType.DAILY,
        scheduleConfig: { type: 'daily' },
        tasks: Array.from({ length: taskCount }, (_, i) => ({
          name: `t${i}`,
          order: i,
        })),
      }),
    );
    await new Promise(r => setTimeout(r, 150));
    return routine;
  }

  it('getOrCreateForDate is idempotent for same date', async () => {
    const routine = await createRoutine(2);
    const today = formatLocalDate(new Date());
    const a = await firstValueFrom(instanceService.getOrCreateForDate(routine.id, today));
    const b = await firstValueFrom(instanceService.getOrCreateForDate(routine.id, today));
    expect(a.id).toBe(b.id);
  });

  it('toggleTaskCompletion recalculates score and status', async () => {
    const routine = await createRoutine(2);
    const today = formatLocalDate(new Date());
    const instance = await firstValueFrom(
      instanceService.getOrCreateForDate(routine.id, today),
    );
    const tasks = routineService.getRoutineTasks(routine.id);

    const r1 = await firstValueFrom(
      instanceService.toggleTaskCompletion(instance.id, tasks[0].id),
    );
    expect(r1.completed).toBeTrue();
    expect(r1.instance.completionScore).toBe(50);
    expect(r1.instance.status).toBe(RoutineInstanceStatus.IN_PROGRESS);

    const r2 = await firstValueFrom(
      instanceService.toggleTaskCompletion(instance.id, tasks[1].id),
    );
    expect(r2.instance.completionScore).toBe(100);
    expect(r2.instance.status).toBe(RoutineInstanceStatus.COMPLETED);
  });

  it('toggle off restores PENDING when no completions remain', async () => {
    const routine = await createRoutine(1);
    const today = formatLocalDate(new Date());
    const instance = await firstValueFrom(
      instanceService.getOrCreateForDate(routine.id, today),
    );
    const tasks = routineService.getRoutineTasks(routine.id);
    await firstValueFrom(instanceService.toggleTaskCompletion(instance.id, tasks[0].id));
    const off = await firstValueFrom(
      instanceService.toggleTaskCompletion(instance.id, tasks[0].id),
    );
    expect(off.completed).toBeFalse();
    expect(off.instance.completionScore).toBe(0);
    expect(off.instance.status).toBe(RoutineInstanceStatus.PENDING);
  });

  it('completing instance bumps streak to 1 from empty', async () => {
    const routine = await createRoutine(1);
    const today = formatLocalDate(new Date());
    const instance = await firstValueFrom(
      instanceService.getOrCreateForDate(routine.id, today),
    );
    const tasks = routineService.getRoutineTasks(routine.id);
    await firstValueFrom(instanceService.toggleTaskCompletion(instance.id, tasks[0].id));
    expect(routineService.getStreak(routine.id).currentStreak).toBe(1);
    expect(routineService.getStreak(routine.id).longestStreak).toBe(1);
  });

  it('skip marks instance SKIPPED', async () => {
    const routine = await createRoutine(1);
    const today = formatLocalDate(new Date());
    const instance = await firstValueFrom(
      instanceService.getOrCreateForDate(routine.id, today),
    );
    const skipped = await firstValueFrom(instanceService.skip(instance.id));
    expect(skipped.status).toBe(RoutineInstanceStatus.SKIPPED);
  });
});
