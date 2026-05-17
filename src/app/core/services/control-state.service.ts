import { Injectable, computed, effect, inject, linkedSignal } from '@angular/core';
import { HabitService } from './habit.service';
import { RoutineInstanceService } from './routine-instance.service';
import { RoutineInstanceStatus } from '../../models/routine.model';

export type ControlState = 'action' | 'calm';

/**
 * Materializes the dual control state from daily compliance.
 *
 * `auto` derives from habit+routine completion. `state` is a linkedSignal that
 * tracks `auto` but accepts manual override via `setOverride`. When the day
 * advances and `auto` re-emits, any prior override is discarded — the system
 * obeys current biology, not yesterday's mandate.
 *
 * A single `effect` bridges to `<html data-control-state="…">` so the CSS
 * @theme picks up the active palette without per-component plumbing.
 */
@Injectable({ providedIn: 'root' })
export class ControlStateService {
  private readonly habitService = inject(HabitService);
  private readonly routineInstanceService = inject(RoutineInstanceService);

  private readonly auto = computed<ControlState>(() => {
    const habitProgress = this.habitService.todayProgress();
    const instances = this.routineInstanceService.todayInstances();
    const routinesSettled =
      instances.length === 0 ||
      instances.every(
        (i) =>
          i.status === RoutineInstanceStatus.COMPLETED ||
          i.status === RoutineInstanceStatus.SKIPPED,
      );
    return habitProgress >= 100 && routinesSettled ? 'calm' : 'action';
  });

  readonly state = linkedSignal<ControlState, ControlState>({
    source: this.auto,
    computation: (next) => next,
  });

  constructor() {
    effect(() => {
      const value = this.state();
      if (typeof document !== 'undefined') {
        document.documentElement.dataset['controlState'] = value;
      }
    });
  }

  /** Manual override; reset automatically when `auto` next emits. */
  setOverride(state: ControlState): void {
    this.state.set(state);
  }

  /** Force re-sync to derived state. */
  clearOverride(): void {
    this.state.set(this.auto());
  }
}
