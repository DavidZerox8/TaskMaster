import { Injectable } from '@angular/core';

const STORAGE_KEY_PREFIXES = [
  'habits',
  'routines',
  'routine-instances',
  'routine-streaks',
  'task-completions',
  'behavior-events',
  'reminders',
  'adaptive-suggestions',
  'gamification',
  'achievements',
  'challenges',
  'todos',
  'ui-preferences',
  'ai-config',
  'onboarding',
  'user',
];

/**
 * Auth-related keys are intentionally excluded — exporting them would defeat
 * the at-rest security model. After importing on a new device, the user must
 * re-run the PIN setup. This is the documented MVP constraint.
 */
const EXCLUDED_KEY_PREFIXES = ['auth', 'pwa'];

export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupBundle {
  readonly schemaVersion: number;
  readonly exportedAt: string;
  readonly app: 'TaskMaster';
  readonly data: Record<string, unknown>;
}

export interface ImportResult {
  readonly ok: boolean;
  readonly keysRestored: number;
  readonly error?: string;
}

@Injectable({ providedIn: 'root' })
export class BackupService {
  exportToBundle(): BackupBundle {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key === null) continue;
      if (!this.isExportable(key)) continue;
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      data[key] = this.tryParse(raw);
    }
    return {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      app: 'TaskMaster',
      data,
    };
  }

  downloadAsJson(): void {
    const bundle = this.exportToBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskmaster-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importFromFile(file: File): Promise<ImportResult> {
    try {
      const text = await file.text();
      const bundle = JSON.parse(text) as BackupBundle;
      return this.importFromBundle(bundle);
    } catch (err) {
      return { ok: false, keysRestored: 0, error: (err as Error).message };
    }
  }

  importFromBundle(bundle: BackupBundle): ImportResult {
    if (bundle?.app !== 'TaskMaster') {
      return { ok: false, keysRestored: 0, error: 'No es un backup de TaskMaster' };
    }
    if (typeof bundle.schemaVersion !== 'number' || bundle.schemaVersion > BACKUP_SCHEMA_VERSION) {
      return {
        ok: false,
        keysRestored: 0,
        error: `Versión de schema no soportada: ${bundle.schemaVersion}`,
      };
    }
    this.clearExportableKeys();
    let restored = 0;
    for (const [key, value] of Object.entries(bundle.data ?? {})) {
      if (!this.isExportable(key)) continue;
      localStorage.setItem(key, JSON.stringify(value));
      restored++;
    }
    return { ok: true, keysRestored: restored };
  }

  /**
   * Wipes every key the app owns — both the exportable user data and the auth
   * record. Used by the destructive "Reset app" action.
   */
  clearAll(): void {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null) toRemove.push(key);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  }

  private clearExportableKeys(): void {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null && this.isExportable(key)) toRemove.push(key);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  }

  private isExportable(key: string): boolean {
    if (EXCLUDED_KEY_PREFIXES.some((p) => key.startsWith(p))) return false;
    return STORAGE_KEY_PREFIXES.some((p) => key === p || key.startsWith(`${p}.`) || key.startsWith(`${p}_`));
  }

  private tryParse(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
}
