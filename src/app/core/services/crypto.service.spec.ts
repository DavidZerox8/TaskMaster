import { TestBed } from '@angular/core/testing';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CryptoService);
  });

  it('round-trips encrypt/decrypt with derived key', async () => {
    const salt = service.generateSalt();
    const key = await service.deriveKey('123456', salt);
    const payload = await service.encrypt('hello world', key);
    const decrypted = await service.decrypt(payload, key);
    expect(decrypted).toBe('hello world');
  });

  it('verifyPin returns key on match, null on mismatch', async () => {
    const verification = await service.createPinVerification('424242');
    const okKey = await service.verifyPin('424242', verification);
    const badKey = await service.verifyPin('111111', verification);
    expect(okKey).not.toBeNull();
    expect(badKey).toBeNull();
  });

  it('generates distinct salts per call', () => {
    const a = service.generateSalt();
    const b = service.generateSalt();
    expect(a).not.toEqual(b);
  });

  it('decrypt with wrong key throws', async () => {
    const salt = service.generateSalt();
    const correct = await service.deriveKey('999999', salt);
    const wrong = await service.deriveKey('000000', service.generateSalt());
    const payload = await service.encrypt('secret', correct);
    await expectAsync(service.decrypt(payload, wrong)).toBeRejected();
  });
});
