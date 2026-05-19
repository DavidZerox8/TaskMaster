import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { BiometricService } from '../../../../core/services/biometric.service';
import { PIN_DEFAULT_LENGTH } from '../../../../models/auth.model';

@Component({
  selector: 'app-lock-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center px-6 py-10"
         style="background-color: var(--color-surface-bg); color: var(--color-surface-fg);">
      <header class="text-center mb-8">
        <p class="text-sm opacity-60 uppercase tracking-widest mb-2">Bienvenido</p>
        <h1 class="text-2xl font-bold">{{ greeting() }}</h1>
        <p class="text-sm opacity-60 mt-2">Introduce tu PIN para entrar</p>
      </header>

      <!-- PIN dots -->
      <div class="flex gap-3 mb-8" [class.animate-shake]="shake()">
        @for (slot of slots(); track $index) {
          <span
            class="w-4 h-4 rounded-full border-2 transition-colors"
            [style.background-color]="$index < entered().length ? 'var(--color-conviction-core)' : 'transparent'"
            [style.border-color]="'var(--color-conviction-core)'"></span>
        }
      </div>

      <!-- Cooldown / error -->
      @if (errorText(); as text) {
        <p class="mb-4 text-sm font-medium" style="color: var(--color-control-fail);">{{ text }}</p>
      }

      <!-- Number pad -->
      <div class="grid grid-cols-3 gap-3 w-72">
        @for (digit of digits; track digit) {
          <button
            type="button"
            class="h-16 rounded-2xl text-2xl font-semibold transition-colors active:scale-95"
            style="background-color: var(--color-surface-muted); color: var(--color-surface-fg); border: 1px solid var(--color-surface-border);"
            [disabled]="locked()"
            (click)="press(digit)">
            {{ digit }}
          </button>
        }
        @if (biometricAvailable()) {
          <button type="button"
                  class="h-16 rounded-2xl text-xl transition-colors active:scale-95"
                  style="background-color: var(--color-surface-muted); color: var(--color-conviction-core); border: 1px solid var(--color-surface-border);"
                  [disabled]="locked()"
                  aria-label="Desbloquear con biometría"
                  (click)="onBiometric()">
            ⊙
          </button>
        } @else {
          <span></span>
        }
        <button type="button"
                class="h-16 rounded-2xl text-2xl font-semibold transition-colors active:scale-95"
                style="background-color: var(--color-surface-muted); color: var(--color-surface-fg); border: 1px solid var(--color-surface-border);"
                [disabled]="locked()"
                (click)="press('0')">
          0
        </button>
        <button type="button"
                class="h-16 rounded-2xl text-xl transition-colors active:scale-95"
                style="background-color: var(--color-surface-muted); color: var(--color-surface-fg); border: 1px solid var(--color-surface-border);"
                [disabled]="locked() || entered().length === 0"
                aria-label="Borrar"
                (click)="backspace()">
          ←
        </button>
      </div>

      @if (resetRequired()) {
        <button type="button"
                class="mt-8 text-sm underline opacity-60"
                (click)="confirmReset()">
          Restablecer aplicación
        </button>
      }
    </div>
  `,
  styles: [`
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
    .animate-shake { animation: shake 0.4s; }
  `],
})
export class LockPageComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly biometric = inject(BiometricService);
  private readonly router = inject(Router);

  protected readonly digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  protected readonly entered = signal<string>('');
  protected readonly shake = signal(false);
  protected readonly biometricAvailable = signal(false);
  protected readonly cooldownTick = signal(Date.now());

  protected readonly pinLength = computed(() => this.auth.pinLength() ?? PIN_DEFAULT_LENGTH);
  protected readonly slots = computed(() => Array.from({ length: this.pinLength() }));
  protected readonly greeting = computed(() => {
    const name = this.auth.currentUser()?.displayName;
    return name ? `Hola, ${name}` : 'Hola';
  });

  protected readonly resetRequired = computed(() => this.auth.status() === 'reset-required');
  protected readonly locked = computed(() => {
    const status = this.auth.status();
    return status === 'cooldown' || status === 'reset-required';
  });
  protected readonly errorText = computed<string | null>(() => {
    if (this.resetRequired()) return 'Demasiados intentos. Restablece la aplicación.';
    const cooldown = this.auth.cooldownUntil();
    if (cooldown && cooldown > this.cooldownTick()) {
      const seconds = Math.ceil((cooldown - this.cooldownTick()) / 1000);
      return `Espera ${seconds}s antes de reintentar`;
    }
    if (this.auth.failedAttempts() > 0) {
      const remaining = 10 - this.auth.failedAttempts();
      return `PIN incorrecto. ${remaining} intentos restantes.`;
    }
    return null;
  });

  private tickHandle: ReturnType<typeof setInterval> | null = null;

  async ngOnInit(): Promise<void> {
    if (this.auth.status() === 'setup') {
      this.router.navigateByUrl('/onboarding/welcome');
      return;
    }
    if (this.auth.status() === 'unlocked') {
      this.router.navigateByUrl('/dashboard');
      return;
    }
    const availability = await this.biometric.isAvailable();
    this.biometricAvailable.set(availability.available && (this.auth.currentUser()?.biometricEnabled ?? false));
    this.tickHandle = setInterval(() => this.cooldownTick.set(Date.now()), 1000);
  }

  ngOnDestroy(): void {
    if (this.tickHandle !== null) clearInterval(this.tickHandle);
  }

  press(digit: string): void {
    if (this.locked()) return;
    if (this.entered().length >= this.pinLength()) return;
    this.entered.update((v) => v + digit);
    if (this.entered().length === this.pinLength()) {
      void this.submit();
    }
  }

  backspace(): void {
    if (this.locked()) return;
    this.entered.update((v) => v.slice(0, -1));
  }

  async onBiometric(): Promise<void> {
    const result = await this.biometric.authenticate('Desbloquear TaskMaster');
    if (!result.ok) return;
    const key = await this.biometric.getStoredKey();
    if (key) {
      this.auth.unlockWithKey(key);
      this.router.navigateByUrl('/dashboard');
    }
  }

  async confirmReset(): Promise<void> {
    if (!confirm('Esto borrará todos tus datos locales. ¿Continuar?')) return;
    this.auth.reset();
    this.router.navigateByUrl('/onboarding/welcome');
  }

  private async submit(): Promise<void> {
    const pin = this.entered();
    const result = await this.auth.unlock(pin);
    this.entered.set('');
    if (result.ok) {
      this.router.navigateByUrl('/dashboard');
      return;
    }
    if (result.reason === 'mismatch') {
      this.shake.set(true);
      setTimeout(() => this.shake.set(false), 500);
    }
  }
}
