import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { GamificationService } from '../../../../core/services/gamification.service';

@Component({
  selector: 'app-level-up-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (gamificationService.levelUpEvent(); as event) {
      <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 animate-fade-in"
             style="background-color: color-mix(in oklch, var(--color-surface-fg) 70%, transparent);"
             (click)="dismiss()"></div>

        <!-- Content -->
        <div class="relative bg-white rounded-2xl shadow-md border border-gray-200 max-w-sm w-full overflow-hidden animate-level-up-enter">
          <!-- Top gradient -->
          <div class="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          <!-- Particles -->
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="particle particle-1"></div>
            <div class="particle particle-2"></div>
            <div class="particle particle-3"></div>
            <div class="particle particle-4"></div>
            <div class="particle particle-5"></div>
            <div class="particle particle-6"></div>
          </div>

          <div class="relative p-8 text-center">
            <!-- Level badge -->
            <div class="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm animate-bounce-in mb-4">
              <span class="text-3xl font-black text-white">{{ event.newLevel }}</span>
            </div>

            <!-- Title -->
            <h2 class="text-2xl font-bold text-gray-900 mb-1">Nivel {{ event.newLevel }}!</h2>
            <p class="text-lg font-semibold text-indigo-600 mb-3">{{ event.title }}</p>
            <p class="text-sm text-gray-500 mb-6">
              Has ganado <span class="font-bold text-amber-600">{{ event.pointsEarned }} puntos</span> canjeables
            </p>

            <!-- Stats -->
            <div class="flex justify-center gap-6 mb-6">
              <div class="text-center">
                <p class="text-2xl font-bold text-indigo-600">{{ event.totalXP }}</p>
                <p class="text-xs text-gray-400">XP Total</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-amber-600">{{ event.pointsEarned }}</p>
                <p class="text-xs text-gray-400">Puntos ganados</p>
              </div>
            </div>

            <!-- Button -->
            <button
              (click)="dismiss()"
              class="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md">
              Continuar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .particle {
      position: absolute;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: particleFloat 2s ease-out forwards;
    }
    .particle-1 { background: #818cf8; left: 20%; top: 50%; animation-delay: 0s; }
    .particle-2 { background: #a78bfa; left: 80%; top: 40%; animation-delay: 0.2s; }
    .particle-3 { background: #f472b6; left: 30%; top: 70%; animation-delay: 0.4s; }
    .particle-4 { background: #fbbf24; left: 70%; top: 60%; animation-delay: 0.1s; }
    .particle-5 { background: #34d399; left: 50%; top: 30%; animation-delay: 0.3s; }
    .particle-6 { background: #60a5fa; left: 40%; top: 80%; animation-delay: 0.5s; }

    @keyframes particleFloat {
      0% { opacity: 1; transform: translateY(0) scale(1); }
      100% { opacity: 0; transform: translateY(-80px) scale(0); }
    }
  `],
})
export class LevelUpModalComponent {
  gamificationService = inject(GamificationService);

  dismiss(): void {
    this.gamificationService.dismissLevelUp();
  }
}
