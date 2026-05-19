import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-done-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center px-6 text-center animate-fade-in"
         style="background-color: var(--color-surface-bg); color: var(--color-surface-fg);">
      <span class="text-6xl mb-4 animate-bounce-in" aria-hidden="true">🎯</span>
      <h1 class="text-3xl font-bold mb-2">Listo</h1>
      <p class="opacity-60 mb-8 max-w-sm">
        Tu motor de control está calibrado. Empieza por tu primer día.
      </p>
      <button type="button"
              class="btn-primary px-8"
              (click)="enter()">
        Entrar
      </button>
    </div>
  `,
})
export class DonePageComponent {
  private readonly router = inject(Router);
  enter(): void {
    this.router.navigateByUrl('/dashboard');
  }
}
