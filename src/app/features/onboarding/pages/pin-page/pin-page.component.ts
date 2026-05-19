import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingService } from '../../../../core/services/onboarding.service';
import { OnboardingShellComponent } from '../../components/onboarding-shell/onboarding-shell.component';
import { PIN_DEFAULT_LENGTH } from '../../../../models/auth.model';

@Component({
  selector: 'app-pin-page',
  standalone: true,
  imports: [OnboardingShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-onboarding-shell
      [step]="5"
      [showBack]="true"
      [canAdvance]="canSubmit()"
      [advanceLabel]="phase() === 'create' ? 'Continuar' : 'Crear cuenta'"
      (back)="onBack()"
      (advance)="onNext()">
      <h1 class="text-2xl font-bold mb-2">
        {{ phase() === 'create' ? 'Crea tu PIN' : 'Confírmalo' }}
      </h1>
      <p class="opacity-60 mb-6 text-sm">
        Si olvidas tu PIN perderás los datos locales. Exporta backup cuando configures el perfil.
      </p>

      <!-- PIN dots -->
      <div class="flex gap-3 justify-center mb-6">
        @for (slot of slots; track $index) {
          <span class="w-4 h-4 rounded-full border-2"
                [style.background-color]="$index < currentValue().length ? 'var(--color-conviction-core)' : 'transparent'"
                [style.border-color]="'var(--color-conviction-core)'"></span>
        }
      </div>

      @if (errorText(); as text) {
        <p class="text-center text-sm mb-4" style="color: var(--color-control-fail);">{{ text }}</p>
      }

      <!-- Number pad -->
      <div class="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        @for (d of digits; track d) {
          <button type="button"
                  class="h-14 rounded-xl text-xl font-semibold transition-colors active:scale-95"
                  style="background-color: var(--color-surface-muted); color: var(--color-surface-fg); border: 1px solid var(--color-surface-border);"
                  (click)="press(d)">
            {{ d }}
          </button>
        }
        <span></span>
        <button type="button"
                class="h-14 rounded-xl text-xl font-semibold transition-colors active:scale-95"
                style="background-color: var(--color-surface-muted); color: var(--color-surface-fg); border: 1px solid var(--color-surface-border);"
                (click)="press('0')">
          0
        </button>
        <button type="button"
                class="h-14 rounded-xl transition-colors active:scale-95"
                style="background-color: var(--color-surface-muted); color: var(--color-surface-fg); border: 1px solid var(--color-surface-border);"
                (click)="backspace()">
          ←
        </button>
      </div>
    </app-onboarding-shell>
  `,
})
export class PinPageComponent {
  protected readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  protected readonly digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  protected readonly slots = Array.from({ length: PIN_DEFAULT_LENGTH });
  protected readonly phase = signal<'create' | 'confirm'>('create');

  protected readonly currentValue = computed(() =>
    this.phase() === 'create' ? this.onboarding.draft().pin : this.onboarding.draft().pinConfirm,
  );

  protected readonly canSubmit = computed(() => this.currentValue().length === PIN_DEFAULT_LENGTH);

  protected readonly errorText = computed(() => {
    const d = this.onboarding.draft();
    if (this.phase() === 'confirm' && d.pinConfirm.length === PIN_DEFAULT_LENGTH && d.pin !== d.pinConfirm) {
      return 'Los PINs no coinciden';
    }
    return null;
  });

  press(digit: string): void {
    if (this.currentValue().length >= PIN_DEFAULT_LENGTH) return;
    const next = this.currentValue() + digit;
    if (this.phase() === 'create') this.onboarding.setPin(next);
    else this.onboarding.setPinConfirm(next);
  }

  backspace(): void {
    const next = this.currentValue().slice(0, -1);
    if (this.phase() === 'create') this.onboarding.setPin(next);
    else this.onboarding.setPinConfirm(next);
  }

  onBack(): void {
    if (this.phase() === 'confirm') {
      this.phase.set('create');
      this.onboarding.setPinConfirm('');
      return;
    }
    this.onboarding.prev();
    this.router.navigateByUrl('/onboarding/ai');
  }

  async onNext(): Promise<void> {
    if (this.phase() === 'create') {
      this.phase.set('confirm');
      return;
    }
    const d = this.onboarding.draft();
    if (d.pin !== d.pinConfirm) return;
    await this.onboarding.complete();
    this.router.navigateByUrl('/onboarding/done');
  }
}
