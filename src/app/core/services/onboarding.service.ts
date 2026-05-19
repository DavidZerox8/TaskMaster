import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { RoutineService } from './routine.service';
import { TemplateCatalogService } from './template-catalog.service';

export type OnboardingStep =
  | 'welcome'
  | 'goals'
  | 'templates'
  | 'ai'
  | 'pin'
  | 'done';

export type Goal =
  | 'health'
  | 'productivity'
  | 'mindfulness'
  | 'learning'
  | 'fitness'
  | 'social'
  | 'custom';

export interface OnboardingDraft {
  displayName: string;
  goals: Goal[];
  selectedTemplateIds: string[];
  pin: string;
  pinConfirm: string;
  aiSkipped: boolean;
}

const STORAGE_KEY = 'onboarding.completed';
const STEPS_ORDER: ReadonlyArray<OnboardingStep> = [
  'welcome',
  'goals',
  'templates',
  'ai',
  'pin',
  'done',
];
const MAX_TEMPLATES = 3;
const MAX_GOALS = 4;

function emptyDraft(): OnboardingDraft {
  return {
    displayName: '',
    goals: [],
    selectedTemplateIds: [],
    pin: '',
    pinConfirm: '',
    aiSkipped: false,
  };
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly auth = inject(AuthService);
  private readonly routineService = inject(RoutineService);
  private readonly templates = inject(TemplateCatalogService);

  private readonly stepSignal = signal<OnboardingStep>('welcome');
  private readonly draftSignal = signal<OnboardingDraft>(emptyDraft());
  private readonly completedSignal = signal<boolean>(
    localStorage.getItem(STORAGE_KEY) === 'true',
  );

  readonly step = this.stepSignal.asReadonly();
  readonly draft = this.draftSignal.asReadonly();
  readonly completed = this.completedSignal.asReadonly();

  readonly stepIndex = computed(() => STEPS_ORDER.indexOf(this.stepSignal()));
  readonly totalSteps = STEPS_ORDER.length;

  readonly canAdvance = computed(() => {
    const d = this.draftSignal();
    switch (this.stepSignal()) {
      case 'welcome':
        return d.displayName.trim().length > 0;
      case 'goals':
        return d.goals.length >= 1;
      case 'templates':
        return true; // templates are optional (0 is valid)
      case 'ai':
        return true; // can always skip
      case 'pin':
        return d.pin.length >= 4 && d.pin === d.pinConfirm;
      case 'done':
        return true;
    }
  });

  goto(step: OnboardingStep): void {
    this.stepSignal.set(step);
  }

  next(): void {
    const idx = this.stepIndex();
    if (idx < STEPS_ORDER.length - 1 && this.canAdvance()) {
      this.stepSignal.set(STEPS_ORDER[idx + 1]);
    }
  }

  prev(): void {
    const idx = this.stepIndex();
    if (idx > 0) this.stepSignal.set(STEPS_ORDER[idx - 1]);
  }

  setDisplayName(name: string): void {
    this.draftSignal.update((d) => ({ ...d, displayName: name }));
  }

  toggleGoal(goal: Goal): void {
    this.draftSignal.update((d) => {
      const present = d.goals.includes(goal);
      if (present) return { ...d, goals: d.goals.filter((g) => g !== goal) };
      if (d.goals.length >= MAX_GOALS) return d;
      return { ...d, goals: [...d.goals, goal] };
    });
  }

  toggleTemplate(id: string): void {
    this.draftSignal.update((d) => {
      const present = d.selectedTemplateIds.includes(id);
      if (present) {
        return { ...d, selectedTemplateIds: d.selectedTemplateIds.filter((t) => t !== id) };
      }
      if (d.selectedTemplateIds.length >= MAX_TEMPLATES) return d;
      return { ...d, selectedTemplateIds: [...d.selectedTemplateIds, id] };
    });
  }

  setPin(pin: string): void {
    this.draftSignal.update((d) => ({ ...d, pin }));
  }

  setPinConfirm(pin: string): void {
    this.draftSignal.update((d) => ({ ...d, pinConfirm: pin }));
  }

  skipAi(): void {
    this.draftSignal.update((d) => ({ ...d, aiSkipped: true }));
  }

  /**
   * Finalize: create the user (via AuthService.setupPin), seed selected
   * routines, mark onboarding completed. Caller should redirect to /dashboard
   * after this resolves.
   */
  async complete(): Promise<void> {
    const d = this.draftSignal();
    if (!this.canAdvance() && this.stepSignal() === 'pin') {
      throw new Error('PIN setup incomplete');
    }
    await this.auth.setupPin(d.pin, d.displayName);
    const requests = this.templates.toCreateRequests(d.selectedTemplateIds);
    for (const req of requests) {
      await firstValueFrom(this.routineService.create(req));
    }
    localStorage.setItem(STORAGE_KEY, 'true');
    this.completedSignal.set(true);
    this.stepSignal.set('done');
  }

  resetWizard(): void {
    this.stepSignal.set('welcome');
    this.draftSignal.set(emptyDraft());
  }
}
