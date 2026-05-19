import { Injectable, computed, inject, signal } from '@angular/core';
import { CryptoService } from './crypto.service';
import {
  AUTH_STORAGE_KEY,
  AuthRecord,
  AuthStatus,
  COOLDOWN_TIERS,
  LocalUser,
  PIN_MAX_LENGTH,
  PIN_MIN_LENGTH,
  RESET_REQUIRED_ATTEMPTS,
} from '../../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly crypto = inject(CryptoService);

  private readonly recordSignal = signal<AuthRecord | null>(readRecord());
  /** In-memory derived key for at-rest encryption. Never persisted. */
  private readonly sessionKey = signal<CryptoKey | null>(null);

  readonly record = this.recordSignal.asReadonly();
  readonly currentUser = computed<LocalUser | null>(() => this.recordSignal()?.user ?? null);
  readonly pinLength = computed(() => this.recordSignal()?.pinLength ?? null);
  readonly failedAttempts = computed(() => this.recordSignal()?.failedAttempts ?? 0);
  readonly cooldownUntil = computed(() => this.recordSignal()?.cooldownUntil ?? null);
  readonly isUnlocked = computed(() => this.sessionKey() !== null);

  readonly status = computed<AuthStatus>(() => {
    const record = this.recordSignal();
    if (!record) return 'setup';
    if (record.failedAttempts >= RESET_REQUIRED_ATTEMPTS) return 'reset-required';
    if (this.sessionKey() !== null) return 'unlocked';
    if (record.cooldownUntil !== null && record.cooldownUntil > Date.now()) return 'cooldown';
    return 'locked';
  });

  async setupPin(pin: string, displayName: string, pinLength = pin.length): Promise<void> {
    if (pin.length < PIN_MIN_LENGTH || pin.length > PIN_MAX_LENGTH) {
      throw new Error(`PIN must be ${PIN_MIN_LENGTH}-${PIN_MAX_LENGTH} digits`);
    }
    if (this.recordSignal() !== null) {
      throw new Error('Auth record already exists; call reset() first');
    }
    const pinVerification = await this.crypto.createPinVerification(pin);
    const key = await this.crypto.deriveKey(pin, decodeSalt(pinVerification.salt));
    const record: AuthRecord = {
      user: {
        displayName: displayName.trim() || 'Tú',
        createdAt: new Date().toISOString(),
        biometricEnabled: false,
      },
      pinVerification,
      pinLength,
      failedAttempts: 0,
      cooldownUntil: null,
    };
    writeRecord(record);
    this.recordSignal.set(record);
    this.sessionKey.set(key);
  }

  async unlock(pin: string): Promise<{ ok: boolean; reason?: 'cooldown' | 'mismatch' | 'reset-required' }> {
    const record = this.recordSignal();
    if (!record) return { ok: false, reason: 'mismatch' };
    if (record.failedAttempts >= RESET_REQUIRED_ATTEMPTS) return { ok: false, reason: 'reset-required' };
    if (record.cooldownUntil !== null && record.cooldownUntil > Date.now()) {
      return { ok: false, reason: 'cooldown' };
    }
    const key = await this.crypto.verifyPin(pin, record.pinVerification);
    if (!key) {
      this.registerFailure(record);
      return { ok: false, reason: 'mismatch' };
    }
    this.registerSuccess(record);
    this.sessionKey.set(key);
    return { ok: true };
  }

  /** Used by biometric flows: directly inject the derived key without PIN prompt. */
  unlockWithKey(key: CryptoKey): void {
    const record = this.recordSignal();
    if (!record) return;
    this.registerSuccess(record);
    this.sessionKey.set(key);
  }

  lock(): void {
    this.sessionKey.set(null);
  }

  reset(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.recordSignal.set(null);
    this.sessionKey.set(null);
  }

  enableBiometric(): void {
    this.patch({ user: { ...this.requireUser(), biometricEnabled: true } });
  }

  disableBiometric(): void {
    this.patch({ user: { ...this.requireUser(), biometricEnabled: false } });
  }

  getSessionKey(): CryptoKey | null {
    return this.sessionKey();
  }

  private registerFailure(record: AuthRecord): void {
    const attempts = record.failedAttempts + 1;
    const tier = [...COOLDOWN_TIERS].reverse().find((t) => attempts >= t.attempts);
    const cooldownUntil = tier ? Date.now() + tier.cooldownMs : null;
    this.patch({ failedAttempts: attempts, cooldownUntil });
  }

  private registerSuccess(record: AuthRecord): void {
    if (record.failedAttempts === 0 && record.cooldownUntil === null) return;
    this.patch({ failedAttempts: 0, cooldownUntil: null });
  }

  private patch(partial: Partial<AuthRecord>): void {
    const next = { ...this.requireRecord(), ...partial };
    writeRecord(next);
    this.recordSignal.set(next);
  }

  private requireRecord(): AuthRecord {
    const r = this.recordSignal();
    if (!r) throw new Error('AuthService: no record loaded');
    return r;
  }

  private requireUser(): LocalUser {
    return this.requireRecord().user;
  }
}

function readRecord(): AuthRecord | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthRecord) : null;
  } catch {
    return null;
  }
}

function writeRecord(record: AuthRecord): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(record));
}

function decodeSalt(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
