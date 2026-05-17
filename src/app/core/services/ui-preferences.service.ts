import { Injectable, computed, effect, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

interface UiPreferencesState {
  completedCollapsed: boolean;
  showStatsCompact: boolean;
}

const STORAGE_KEY = 'ui-preferences';

const DEFAULT_STATE: UiPreferencesState = {
  completedCollapsed: false,
  showStatsCompact: true,
};

function readInitialState(): UiPreferencesState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_STATE, ...JSON.parse(stored) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
  private readonly stateSignal = signal<UiPreferencesState>(readInitialState());

  readonly state = this.stateSignal.asReadonly();
  readonly completedCollapsed = computed(() => this.stateSignal().completedCollapsed);
  readonly showStatsCompact = computed(() => this.stateSignal().showStatsCompact);

  /** Backward-compatible Observable façade for legacy consumers. */
  readonly state$ = toObservable(this.stateSignal);

  constructor() {
    effect(() => {
      const snapshot = this.stateSignal();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        /* storage may be unavailable; mandate forbids silent retries */
      }
    });
  }

  get value(): UiPreferencesState {
    return this.stateSignal();
  }

  setCompletedCollapsed(collapsed: boolean): void {
    this.patch({ completedCollapsed: collapsed });
  }

  toggleCompletedCollapsed(): void {
    this.patch({ completedCollapsed: !this.value.completedCollapsed });
  }

  setShowStatsCompact(show: boolean): void {
    this.patch({ showStatsCompact: show });
  }

  private patch(partial: Partial<UiPreferencesState>): void {
    this.stateSignal.update((current) => ({ ...current, ...partial }));
  }
}
