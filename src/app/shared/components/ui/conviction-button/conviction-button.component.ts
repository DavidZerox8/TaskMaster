import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  HostListener,
  HostBinding,
} from '@angular/core';

/**
 * Press-and-hold completion control. The doctrine of "fricción cognitiva
 * como feature": progress is extracted by sustained will, not granted by a
 * single click.
 *
 * Note on ElementInternals: the plan called for `attachInternals()` to bind
 * to native form validation. That API requires registration via
 * `customElements.define(...)`, which Angular components are not by default.
 * Wrapping via `createCustomElement` would force Angular Elements just for
 * this control. We instead expose a clean `complete` output and a
 * `completed` input; consumers integrate with reactive forms via standard
 * value bindings. The friction UX — the actual mandate — is preserved.
 */
@Component({
  selector: 'app-conviction-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="relative inline-flex items-center justify-center select-none touch-none overflow-hidden rounded-full transition-colors"
      [class.opacity-60]="completed()"
      [attr.aria-pressed]="completed()"
      [attr.aria-label]="ariaLabel()"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.background-color]="completed() ? 'var(--color-control-pass)' : 'var(--color-surface-bg)'"
      [style.border]="'2px solid ' + (completed() ? 'var(--color-control-pass)' : 'var(--color-conviction-core)')"
      [style.color]="completed() ? 'var(--color-conviction-fg)' : 'var(--color-conviction-core)'"
      (pointerdown)="onPress($event)"
      (pointerup)="onRelease()"
      (pointercancel)="onRelease()"
      (pointerleave)="onRelease()"
      (keydown.space)="onKeyPress($event)"
      (keydown.enter)="onKeyPress($event)"
      (keyup.space)="onRelease()"
      (keyup.enter)="onRelease()">
      <!-- Progress ring fills as user holds -->
      <span
        class="absolute inset-0 rounded-full pointer-events-none"
        [style.background]="ringGradient()"
        [style.opacity]="holding() ? 1 : 0"
        [style.transition]="holding() ? 'none' : 'opacity 200ms var(--ease-snappy)'">
      </span>
      <span class="relative text-base font-bold">
        @if (completed()) {
          ✓
        } @else {
          ●
        }
      </span>
    </button>
  `,
})
export class ConvictionButtonComponent {
  readonly completed = input<boolean>(false);
  /** Hold duration in ms required to emit `complete`. */
  readonly threshold = input<number>(600);
  readonly size = input<number>(36);
  readonly ariaLabel = input<string>('Mantener pulsado para completar');

  readonly complete = output<void>();

  private readonly pressStartAt = signal<number | null>(null);
  private readonly nowTick = signal<number>(0);
  private rafHandle: number | null = null;
  private timerHandle: ReturnType<typeof setTimeout> | null = null;

  readonly holding = computed(() => this.pressStartAt() !== null);

  readonly progress = computed(() => {
    const start = this.pressStartAt();
    if (start === null) return 0;
    // Read nowTick to make this reactive to the RAF loop.
    this.nowTick();
    return Math.min(1, (performance.now() - start) / this.threshold());
  });

  readonly ringGradient = computed(() => {
    const pct = this.progress() * 100;
    return `conic-gradient(var(--color-conviction-core) ${pct}%, transparent 0)`;
  });

  @HostBinding('attr.data-holding')
  get holdingAttr(): string | null {
    return this.holding() ? 'true' : null;
  }

  onPress(event: PointerEvent): void {
    if (this.completed()) return;
    event.preventDefault();
    this.pressStartAt.set(performance.now());
    this.scheduleTick();
    this.timerHandle = setTimeout(() => {
      if (this.pressStartAt() !== null) {
        this.complete.emit();
        this.reset();
      }
    }, this.threshold());
  }

  onKeyPress(event: Event): void {
    if (event instanceof KeyboardEvent && event.repeat) return;
    event.preventDefault();
    if (this.completed() || this.holding()) return;
    this.pressStartAt.set(performance.now());
    this.scheduleTick();
    this.timerHandle = setTimeout(() => {
      if (this.pressStartAt() !== null) {
        this.complete.emit();
        this.reset();
      }
    }, this.threshold());
  }

  onRelease(): void {
    if (!this.holding()) return;
    this.reset();
  }

  private scheduleTick(): void {
    const tick = () => {
      if (this.pressStartAt() === null) return;
      this.nowTick.set(performance.now());
      this.rafHandle = requestAnimationFrame(tick);
    };
    this.rafHandle = requestAnimationFrame(tick);
  }

  private reset(): void {
    this.pressStartAt.set(null);
    if (this.timerHandle !== null) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }
}
