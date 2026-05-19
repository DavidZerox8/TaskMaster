import { TestBed } from '@angular/core/testing';
import { BackupService, BACKUP_SCHEMA_VERSION } from './backup.service';

describe('BackupService', () => {
  let service: BackupService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackupService);
  });

  it('exports app-owned keys and skips auth', () => {
    localStorage.setItem('habits', JSON.stringify([{ id: 'h1' }]));
    localStorage.setItem('auth.user', JSON.stringify({ secret: true }));
    const bundle = service.exportToBundle();
    expect(bundle.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(bundle.data['habits']).toEqual([{ id: 'h1' }]);
    expect(bundle.data['auth.user']).toBeUndefined();
  });

  it('importFromBundle restores keys and wipes prior exportable state', () => {
    localStorage.setItem('habits', JSON.stringify([{ id: 'old' }]));
    const result = service.importFromBundle({
      app: 'TaskMaster',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: { habits: [{ id: 'new' }], 'routines.list': [{ id: 'r1' }] },
    });
    expect(result.ok).toBeTrue();
    expect(result.keysRestored).toBe(2);
    expect(JSON.parse(localStorage.getItem('habits')!)).toEqual([{ id: 'new' }]);
  });

  it('importFromBundle rejects unknown app', () => {
    const result = service.importFromBundle({
      app: 'OtherApp' as 'TaskMaster',
      schemaVersion: 1,
      exportedAt: '',
      data: {},
    });
    expect(result.ok).toBeFalse();
  });

  it('importFromBundle rejects future schema', () => {
    const result = service.importFromBundle({
      app: 'TaskMaster',
      schemaVersion: 999,
      exportedAt: '',
      data: {},
    });
    expect(result.ok).toBeFalse();
  });

  it('clearAll wipes every key', () => {
    localStorage.setItem('habits', 'x');
    localStorage.setItem('auth.user', 'y');
    service.clearAll();
    expect(localStorage.length).toBe(0);
  });
});
