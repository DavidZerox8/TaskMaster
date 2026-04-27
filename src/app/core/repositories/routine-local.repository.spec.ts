import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { RoutineLocalRepository } from './routine-local.repository';
import { ScheduleType } from '../../models/routine.model';

describe('RoutineLocalRepository', () => {
  let repo: RoutineLocalRepository;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    repo = TestBed.inject(RoutineLocalRepository);
  });

  afterEach(() => localStorage.clear());

  it('creates a routine with tasks and persists both', async () => {
    const created = await firstValueFrom(
      repo.create({
        name: 'Morning routine',
        scheduleType: ScheduleType.DAILY,
        scheduleConfig: { type: 'daily', timeWindowStart: '07:00' },
        tasks: [
          { name: 'Stretch', order: 0 },
          { name: 'Hydrate', order: 1 },
          { name: 'Plan day', order: 2 },
        ],
      }),
    );
    expect(created.id).toBeTruthy();
    expect(created.userId).toBe('local-user');
    expect(created.active).toBeTrue();

    const tasks = await firstValueFrom(repo.getTasks(created.id));
    expect(tasks.length).toBe(3);
    expect(tasks.map(t => t.name)).toEqual(['Stretch', 'Hydrate', 'Plan day']);
  });

  it('filters by active flag', async () => {
    const a = await firstValueFrom(
      repo.create({
        name: 'A',
        scheduleType: ScheduleType.DAILY,
        scheduleConfig: { type: 'daily' },
      }),
    );
    await firstValueFrom(
      repo.create({
        name: 'B',
        scheduleType: ScheduleType.DAILY,
        scheduleConfig: { type: 'daily' },
      }),
    );
    await firstValueFrom(repo.update(a.id, { active: false }));
    const onlyActive = await firstValueFrom(repo.getAll({ active: true }));
    expect(onlyActive.length).toBe(1);
    expect(onlyActive[0].name).toBe('B');
  });

  it('reorders tasks by id list', async () => {
    const r = await firstValueFrom(
      repo.create({
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
    const tasks = await firstValueFrom(repo.getTasks(r.id));
    const reordered = await firstValueFrom(
      repo.reorderTasks(r.id, [tasks[2].id, tasks[0].id, tasks[1].id]),
    );
    expect(reordered.map(t => t.name)).toEqual(['three', 'one', 'two']);
  });

  it('cascades task deletion when routine deleted', async () => {
    const r = await firstValueFrom(
      repo.create({
        name: 'R',
        scheduleType: ScheduleType.DAILY,
        scheduleConfig: { type: 'daily' },
        tasks: [{ name: 'x', order: 0 }],
      }),
    );
    await firstValueFrom(repo.delete(r.id));
    const tasks = await firstValueFrom(repo.getAllTasks());
    expect(tasks.length).toBe(0);
  });

  it('persists across new instances via localStorage', async () => {
    await firstValueFrom(
      repo.create({
        name: 'persisted',
        scheduleType: ScheduleType.WEEKLY,
        scheduleConfig: { type: 'weekly', days: [1, 3, 5] as any },
      }),
    );
    const fresh = TestBed.inject(RoutineLocalRepository);
    const all = await firstValueFrom(fresh.getAll());
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('persisted');
  });
});
