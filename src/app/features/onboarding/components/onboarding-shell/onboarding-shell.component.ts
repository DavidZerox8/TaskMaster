import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-onboarding-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col px-6 py-8"
         style="background-color: var(--color-surface-bg); color: var(--color-surface-fg);">
      <!-- Progress -->
      <div class="flex gap-1.5 mb-8">
        @for (i of [1,2,3,4,5,6]; track i) {
          <span
            class="flex-1 h-1 rounded-full transition-colors"
            [style.background-color]="i <= step() ? 'var(--color-conviction-core)' : 'var(--color-surface-border)'"></span>
        }
      </div>

      <!-- Body -->
      <div class="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
        <ng-content />
      </div>

      <!-- Footer -->
      <div class="max-w-md w-full mx-auto mt-8 flex gap-3">
        @if (showBack()) {
          <button type="button"
                  class="btn-secondary flex-1"
                  (click)="back.emit()">
            Atrás
          </button>
        }
        <button type="button"
                class="btn-primary flex-1"
                [disabled]="!canAdvance()"
                (click)="advance.emit()">
          {{ advanceLabel() }}
        </button>
      </div>
    </div>
  `,
})
export class OnboardingShellComponent {
  readonly step = input.required<number>();
  readonly canAdvance = input<boolean>(false);
  readonly showBack = input<boolean>(false);
  readonly advanceLabel = input<string>('Continuar');

  readonly advance = output<void>();
  readonly back = output<void>();
}
