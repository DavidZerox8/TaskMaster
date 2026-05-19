import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingService, Goal } from '../../../../core/services/onboarding.service';
import { OnboardingShellComponent } from '../../components/onboarding-shell/onboarding-shell.component';

interface GoalOption {
  id: Goal;
  label: string;
  icon: string;
}

const GOALS: GoalOption[] = [
  { id: 'health', label: 'Salud', icon: '🌱' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'productivity', label: 'Productividad', icon: '⚡' },
  { id: 'mindfulness', label: 'Mindfulness', icon: '🧘' },
  { id: 'learning', label: 'Aprendizaje', icon: '📚' },
  { id: 'social', label: 'Social', icon: '🤝' },
];

@Component({
  selector: 'app-goals-page',
  standalone: true,
  imports: [OnboardingShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-onboarding-shell
      [step]="2"
      [showBack]="true"
      [canAdvance]="onboarding.canAdvance()"
      (back)="onBack()"
      (advance)="onNext()">
      <h1 class="text-2xl font-bold mb-2">¿Qué quieres construir?</h1>
      <p class="opacity-60 mb-6">Elige hasta 4 áreas.</p>
      <div class="grid grid-cols-2 gap-3">
        @for (goal of goals; track goal.id) {
          <button type="button"
                  class="flex flex-col items-center p-4 rounded-xl border-2 transition-colors"
                  [style.background-color]="isSelected(goal.id) ? 'var(--color-conviction-soft)' : 'var(--color-surface-bg)'"
                  [style.border-color]="isSelected(goal.id) ? 'var(--color-conviction-core)' : 'var(--color-surface-border)'"
                  [style.color]="'var(--color-surface-fg)'"
                  (click)="toggle(goal.id)">
            <span class="text-3xl mb-2">{{ goal.icon }}</span>
            <span class="text-sm font-medium">{{ goal.label }}</span>
          </button>
        }
      </div>
    </app-onboarding-shell>
  `,
})
export class GoalsPageComponent {
  protected readonly onboarding = inject(OnboardingService);
  protected readonly goals = GOALS;
  private readonly router = inject(Router);

  isSelected(goal: Goal): boolean {
    return this.onboarding.draft().goals.includes(goal);
  }

  toggle(goal: Goal): void {
    this.onboarding.toggleGoal(goal);
  }

  onBack(): void {
    this.onboarding.prev();
    this.router.navigateByUrl('/onboarding/welcome');
  }

  onNext(): void {
    this.onboarding.next();
    this.router.navigateByUrl('/onboarding/templates');
  }
}
