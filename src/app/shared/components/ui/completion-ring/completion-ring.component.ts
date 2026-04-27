import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'app-completion-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 36 36" class="block">
      <circle cx="18" cy="18" r="15.9155"
              fill="none" stroke="currentColor" stroke-opacity="0.15" stroke-width="3" />
      <circle cx="18" cy="18" r="15.9155"
              fill="none" stroke="currentColor" stroke-width="3"
              stroke-linecap="round"
              [attr.stroke-dasharray]="dashArray()"
              transform="rotate(-90 18 18)"
              style="transition: stroke-dasharray 400ms ease;" />
      <text x="18" y="20" text-anchor="middle"
            class="text-[8px] font-semibold fill-current">
        {{ value() }}%
      </text>
    </svg>
  `,
})
export class CompletionRingComponent {
  readonly value = input<number>(0);
  readonly size = input<number>(48);

  protected readonly dashArray = computed(() => {
    const v = Math.max(0, Math.min(100, this.value()));
    return `${v} ${100 - v}`;
  });
}
