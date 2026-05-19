import { PinVerification } from '../core/services/crypto.service';

export type AuthStatus = 'setup' | 'locked' | 'unlocked' | 'cooldown' | 'reset-required';

export interface LocalUser {
  readonly displayName: string;
  readonly createdAt: string;
  readonly biometricEnabled: boolean;
}

/**
 * Persisted shape in `localStorage['auth.user']`. Note: the raw PIN is never
 * stored. `pinVerification` holds only a salt + the SHA-256 hash of the
 * PBKDF2-derived key. The in-memory derived key (used for at-rest encryption)
 * exists only after `unlock` and is wiped on `lock` or `appStateChange`.
 */
export interface AuthRecord {
  readonly user: LocalUser;
  readonly pinVerification: PinVerification;
  readonly pinLength: number;
  readonly failedAttempts: number;
  readonly cooldownUntil: number | null;
}

export const AUTH_STORAGE_KEY = 'auth.user';
export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 8;
export const PIN_DEFAULT_LENGTH = 6;

export const COOLDOWN_TIERS: ReadonlyArray<{ attempts: number; cooldownMs: number }> = [
  { attempts: 3, cooldownMs: 30_000 },
  { attempts: 6, cooldownMs: 5 * 60_000 },
  { attempts: 9, cooldownMs: 30 * 60_000 },
];

export const RESET_REQUIRED_ATTEMPTS = 10;
