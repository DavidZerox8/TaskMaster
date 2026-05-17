import { TestBed } from '@angular/core/testing';
import { MigrationService } from './migration.service';

describe('MigrationService', () => {
  let service: MigrationService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(MigrationService);
  });

  afterEach(() => localStorage.clear());

  it('migrates todos to habits on first run', () => {
    localStorage.setItem(
      'todos',
      JSON.stringify([
        { id: '1', title: 'Run', category: 'salud', completed: false },
      ]),
    );
    service.migrate();
    const habitsRaw = localStorage.getItem('habits');
    expect(habitsRaw).not.toBeNull();
    const habits = JSON.parse(habitsRaw!);
    expect(habits.length).toBe(1);
    expect(habits[0].title).toBe('Run');
  });

  it('initializes routine v2 keys when missing', () => {
    service.migrate();
    expect(localStorage.getItem('routines')).toBe('[]');
    expect(localStorage.getItem('routine_tasks')).toBe('[]');
    expect(localStorage.getItem('routine_instances')).toBe('[]');
    expect(localStorage.getItem('task_completions')).toBe('[]');
    expect(localStorage.getItem('routine_streaks')).toBe('[]');
    expect(localStorage.getItem('behavior_events')).toBe('[]');
    expect(localStorage.getItem('reminder_preferences')).toBe('[]');
    expect(localStorage.getItem('scheduled_reminders')).toBe('[]');
    expect(localStorage.getItem('taskmaster_migration_version')).toBe('2');
  });

  it('does not overwrite existing v2 keys with data', () => {
    localStorage.setItem('routines', JSON.stringify([{ id: 'r1' }]));
    service.migrate();
    const stored = JSON.parse(localStorage.getItem('routines')!);
    expect(stored.length).toBe(1);
    expect(stored[0].id).toBe('r1');
  });

  it('is idempotent — second run does not re-init', () => {
    service.migrate();
    localStorage.setItem('routines', JSON.stringify([{ id: 'r1' }]));
    service.migrate();
    const stored = JSON.parse(localStorage.getItem('routines')!);
    expect(stored.length).toBe(1);
  });

  it('upgrades from v1 directly to v2 without re-running todos migration', () => {
    localStorage.setItem('taskmaster_migration_version', '1');
    localStorage.setItem('todos', JSON.stringify([{ id: '1', title: 'Old' }]));
    service.migrate();
    expect(localStorage.getItem('habits')).toBeNull();
    expect(localStorage.getItem('routines')).toBe('[]');
    expect(localStorage.getItem('taskmaster_migration_version')).toBe('2');
  });
});
