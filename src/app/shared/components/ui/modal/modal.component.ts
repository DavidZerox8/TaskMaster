import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 animate-fade-in"
          style="background-color: color-mix(in oklch, var(--color-surface-fg) 65%, transparent);"
          (click)="onClose()">
        </div>
        <!-- Modal -->
        <div class="relative rounded-xl max-w-md w-full animate-bounce-in overflow-hidden border"
             style="background-color: var(--color-surface-bg); border-color: var(--color-surface-border);">
          <!-- Header -->
          @if (title()) {
            <div class="flex items-center justify-between px-6 py-4 border-b"
                 style="border-color: var(--color-surface-border);">
              <h3 class="text-lg font-semibold" style="color: var(--color-surface-fg);">{{ title() }}</h3>
              <button
                (click)="onClose()"
                class="transition-colors hover:opacity-100 opacity-60"
                style="color: var(--color-surface-fg);">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          }
          <!-- Body -->
          <div class="px-6 py-4">
            <ng-content />
          </div>
          <!-- Footer -->
          <div class="px-6 py-4 border-t"
               style="border-color: var(--color-surface-border); background-color: var(--color-surface-muted);">
            <ng-content select="[modal-footer]" />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  isOpen = input(false);
  title = input('');
  closed = output<void>();

  onClose(): void {
    this.closed.emit();
  }
}
