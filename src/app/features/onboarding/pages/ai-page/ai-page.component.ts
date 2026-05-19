import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingService } from '../../../../core/services/onboarding.service';
import { OnboardingShellComponent } from '../../components/onboarding-shell/onboarding-shell.component';

@Component({
  selector: 'app-ai-page',
  standalone: true,
  imports: [OnboardingShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-onboarding-shell
      [step]="4"
      [showBack]="true"
      [canAdvance]="true"
      (back)="onBack()"
      (advance)="onSkip()">
      <h1 class="text-2xl font-bold mb-2">Coach IA (opcional)</h1>
      <p class="opacity-60 mb-6">
        Puedes conectar tu propia API key de Anthropic o Gemini desde el perfil más adelante.
        La app funciona sin IA — el motor de patrones local sigue auditando tu progreso.
      </p>
      <div class="rounded-xl p-4 mb-4 border"
           style="background-color: var(--color-surface-muted); border-color: var(--color-surface-border);">
        <p class="text-xs uppercase tracking-wider opacity-60 mb-1">Sin IA</p>
        <p class="text-sm">Insights deterministas, recomendaciones adaptativas locales, sin datos enviados a terceros.</p>
      </div>
    </app-onboarding-shell>
  `,
})
export class AiPageComponent {
  protected readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  onBack(): void {
    this.onboarding.prev();
    this.router.navigateByUrl('/onboarding/templates');
  }

  onSkip(): void {
    this.onboarding.skipAi();
    this.onboarding.next();
    this.router.navigateByUrl('/onboarding/pin');
  }
}
