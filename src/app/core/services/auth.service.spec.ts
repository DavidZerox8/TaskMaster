import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { AUTH_STORAGE_KEY } from '../../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('starts in setup status when no record exists', () => {
    expect(service.status()).toBe('setup');
    expect(service.currentUser()).toBeNull();
  });

  it('setupPin persists user and leaves session unlocked', async () => {
    await service.setupPin('123456', 'Alice');
    expect(service.status()).toBe('unlocked');
    expect(service.currentUser()?.displayName).toBe('Alice');
    expect(service.getSessionKey()).not.toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeTruthy();
  });

  it('unlock returns ok on correct PIN after lock', async () => {
    await service.setupPin('123456', 'Bob');
    service.lock();
    expect(service.status()).toBe('locked');
    const result = await service.unlock('123456');
    expect(result.ok).toBeTrue();
    expect(service.status()).toBe('unlocked');
  });

  it('unlock returns mismatch on wrong PIN and increments failures', async () => {
    await service.setupPin('123456', 'Bob');
    service.lock();
    const result = await service.unlock('000000');
    expect(result.ok).toBeFalse();
    expect(result.reason).toBe('mismatch');
    expect(service.failedAttempts()).toBe(1);
  });

  it('triggers cooldown after 3 failed attempts', async () => {
    await service.setupPin('123456', 'Bob');
    service.lock();
    await service.unlock('000000');
    await service.unlock('000000');
    await service.unlock('000000');
    expect(service.failedAttempts()).toBe(3);
    expect(service.cooldownUntil()).toBeGreaterThan(Date.now());
    const blocked = await service.unlock('123456');
    expect(blocked.ok).toBeFalse();
    expect(blocked.reason).toBe('cooldown');
  });

  it('resets failures on successful unlock', async () => {
    await service.setupPin('123456', 'Bob');
    service.lock();
    await service.unlock('000000');
    await service.unlock('000000');
    expect(service.failedAttempts()).toBe(2);
    const ok = await service.unlock('123456');
    expect(ok.ok).toBeTrue();
    expect(service.failedAttempts()).toBe(0);
  });

  it('reset wipes record and key', async () => {
    await service.setupPin('123456', 'Bob');
    service.reset();
    expect(service.status()).toBe('setup');
    expect(service.getSessionKey()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('rejects PIN shorter than 4 digits', async () => {
    await expectAsync(service.setupPin('12', 'X')).toBeRejected();
  });
});
