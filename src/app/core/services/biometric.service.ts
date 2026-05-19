import { Injectable } from '@angular/core';

export interface BiometricAvailability {
  readonly available: boolean;
  readonly reason?: 'no-hardware' | 'not-enrolled' | 'web-no-op' | 'error';
}

export interface BiometricUnlockResult {
  readonly ok: boolean;
  readonly cancelled?: boolean;
  readonly error?: string;
}

/**
 * Capacitor biometric wrapper. On native platforms this should bridge to a
 * plugin (e.g. `@aparajita/capacitor-biometric-auth`); on web it is an
 * explicit no-op so the rest of the auth flow degrades to PIN-only without
 * branching at every callsite.
 *
 * The actual plugin is intentionally not imported here. M4 wires the native
 * bridge once the Capacitor build is being prepared. Until then this service
 * reports unavailable, and the lock page simply hides the biometric button.
 */
@Injectable({ providedIn: 'root' })
export class BiometricService {
  private readonly isNative: boolean = isCapacitorNative();

  async isAvailable(): Promise<BiometricAvailability> {
    if (!this.isNative) return { available: false, reason: 'web-no-op' };
    // Native bridge wired in M4. Until then, report not-enrolled.
    return { available: false, reason: 'not-enrolled' };
  }

  async authenticate(_reason: string): Promise<BiometricUnlockResult> {
    if (!this.isNative) return { ok: false, error: 'web-no-op' };
    return { ok: false, error: 'native-bridge-pending' };
  }

  /**
   * On unlock with biometrics, we still need the AES key. Strategy (to be
   * implemented in M4): store the salted PIN-derived key wrapped by a
   * native-keystore-backed secret. For MVP this stub returns null so the
   * lock page falls back to PIN entry.
   */
  async getStoredKey(): Promise<CryptoKey | null> {
    return null;
  }

  async storeKey(_key: CryptoKey): Promise<void> {
    return;
  }

  async clearStoredKey(): Promise<void> {
    return;
  }
}

function isCapacitorNative(): boolean {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return typeof cap?.isNativePlatform === 'function' ? cap.isNativePlatform() : false;
}
