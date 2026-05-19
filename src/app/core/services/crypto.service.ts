import { Injectable } from '@angular/core';

const PBKDF2_ITERATIONS = 250_000;
const KEY_LENGTH_BITS = 256;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export interface EncryptedPayload {
  /** base64-encoded ciphertext */
  readonly ciphertext: string;
  /** base64-encoded IV */
  readonly iv: string;
}

export interface PinVerification {
  /** base64-encoded SHA-256 hash of the derived key */
  readonly pinHash: string;
  /** base64-encoded salt */
  readonly salt: string;
}

/**
 * Cryptographic primitives backing the local auth and at-rest encryption.
 *
 * Doctrine: never store the PIN, never store the raw derived key. We store
 * only `salt` and `SHA-256(derivedKey)`. On unlock we re-derive the key in
 * memory; that in-memory key is what other services use to encrypt/decrypt
 * sensitive blobs.
 *
 * AES-GCM (256-bit) for encryption — authenticated, single-pass. PBKDF2 with
 * 250k iterations because we run in a JS runtime where memory-hard KDFs
 * (Argon2/scrypt) require WASM bundles the MVP doesn't need.
 */
@Injectable({ providedIn: 'root' })
export class CryptoService {
  private readonly subtle: SubtleCrypto = globalThis.crypto.subtle;

  generateSalt(): Uint8Array {
    return globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  }

  async deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
    const baseKey = await this.subtle.importKey(
      'raw',
      new TextEncoder().encode(pin),
      'PBKDF2',
      false,
      ['deriveKey'],
    );
    return this.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: KEY_LENGTH_BITS },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  async createPinVerification(pin: string): Promise<PinVerification> {
    const salt = this.generateSalt();
    const key = await this.deriveKey(pin, salt);
    const pinHash = await this.hashKey(key);
    return {
      pinHash: bytesToBase64(pinHash),
      salt: bytesToBase64(salt),
    };
  }

  /** Returns the derived key on success, or `null` on PIN mismatch. */
  async verifyPin(pin: string, verification: PinVerification): Promise<CryptoKey | null> {
    const salt = base64ToBytes(verification.salt);
    const key = await this.deriveKey(pin, salt);
    const candidateHash = await this.hashKey(key);
    const candidate = bytesToBase64(candidateHash);
    return constantTimeEqual(candidate, verification.pinHash) ? key : null;
  }

  async encrypt(plaintext: string, key: CryptoKey): Promise<EncryptedPayload> {
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const ciphertext = await this.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      new TextEncoder().encode(plaintext),
    );
    return {
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
      iv: bytesToBase64(iv),
    };
  }

  async decrypt(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
    const plaintext = await this.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(payload.iv) as BufferSource },
      key,
      base64ToBytes(payload.ciphertext) as BufferSource,
    );
    return new TextDecoder().decode(plaintext);
  }

  private async hashKey(key: CryptoKey): Promise<Uint8Array> {
    const raw = await this.subtle.exportKey('raw', key);
    const digest = await this.subtle.digest('SHA-256', raw);
    return new Uint8Array(digest);
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
