import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingService } from '../../../../core/services/onboarding.service';
import { TemplateCatalogService } from '../../../../core/services/template-catalog.service';
import { OnboardingShellComponent } from '../../components/onboarding-shell/onboarding-shell.component';

@Component({
  selector: 'app-templates-page',
  standalone: true,
  imports: [OnboardingShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-onboarding-shell
      [step]="3"
      [showBack]="true"
      [canAdvance]="true"
      [advanceLabel]="advanceLabel()"
      (back)="onBack()"
      (advance)="onNext()">
      <h1 class="text-2xl font-bold mb-2">Elige hasta 3 rutinas</h1>
      <p class="opacity-60 mb-6">O salta este paso y créalas a tu ritmo.</p>
      <div class="space-y-2 max-h-[60vh] overflow-y-auto">
        @for (tpl of templates; track tpl.id) {
          <button type="button"
                  class="w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors"
                  [style.background-color]="isSelected(tpl.id) ? 'var(--color-conviction-soft)' : 'var(--color-surface-bg)'"
                  [style.border-color]="isSelected(tpl.id) ? 'var(--color-conviction-core)' : 'var(--color-surface-border)'"
                  [style.color]="'var(--color-surface-fg)'"
                  (click)="toggle(tpl.id)">
            <span class="text-2xl">{{ tpl.icon }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold">{{ tpl.name }}</p>
              <p class="text-xs opacity-60 truncate">{{ tpl.description }}</p>
            </div>
          </button>
        }
      </div>
    </app-onboarding-shell>
  `,
})
export class TemplatesPageComponent {
  protected readonly onboarding = inject(OnboardingService);
  private readonly catalog = inject(TemplateCatalogService);
  private readonly router = inject(Router);

  protected readonly templates = this.catalog.getAll();

  isSelected(id: string): boolean {
    return this.onboarding.draft().selectedTemplateIds.includes(id);
  }

  toggle(id: string): void {
    this.onboarding.toggleTemplate(id);
  }

  advanceLabel(): string {
    const count = this.onboarding.draft().selectedTemplateIds.length;
    return count === 0 ? 'Saltar' : 'Continuar';
  }

  onBack(): void {
    this.onboarding.prev();
    this.router.navigateByUrl('/onboarding/goals');
  }

  onNext(): void {
    this.onboarding.next();
    this.router.navigateByUrl('/onboarding/ai');
  }
}
