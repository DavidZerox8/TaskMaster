import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OnboardingService } from '../../../../core/services/onboarding.service';
import { OnboardingShellComponent } from '../../components/onboarding-shell/onboarding-shell.component';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [FormsModule, OnboardingShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-onboarding-shell
      [step]="1"
      [canAdvance]="onboarding.canAdvance()"
      (advance)="onNext()">
      <h1 class="text-3xl font-bold mb-2">Bienvenido</h1>
      <p class="opacity-60 mb-8">¿Cómo te llamas?</p>
      <input
        type="text"
        class="input-field text-lg py-3"
        placeholder="Tu nombre"
        autofocus
        [ngModel]="onboarding.draft().displayName"
        (ngModelChange)="onboarding.setDisplayName($event)" />
    </app-onboarding-shell>
  `,
})
export class WelcomePageComponent {
  protected readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  onNext(): void {
    this.onboarding.next();
    this.router.navigateByUrl('/onboarding/goals');
  }
}
