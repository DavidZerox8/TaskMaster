import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'app-streak-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (count() > 0) {
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            [class]="palette()">
        <span aria-hidden="true">🔥</span>
        <span>{{ count() }}</span>
        @if (label()) { <span class="text-[10px] opacity-80">{{ label() }}</span> }
      </span>
    }
  `,
})
export class StreakBadgeComponent {
  readonly count = input<number>(0);
  readonly label = input<string | null>(null);

  protected readonly palette = computed(() => {
    const c = this.count();
    if (c >= 30) return 'bg-purple-100 text-purple-700';
    if (c >= 7) return 'bg-orange-100 text-orange-700';
    if (c >= 3) return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-600';
  });
}
