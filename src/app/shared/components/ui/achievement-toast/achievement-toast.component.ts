import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { GamificationService } from '../../../../core/services/gamification.service';

@Component({
  selector: 'app-achievement-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (event of gamificationService.achievementEvents(); track event.id) {
      <div class="fixed bottom-20 left-1/2 -translate-x-1/2 z-[65] animate-achievement-slide pointer-events-auto sm:bottom-8">
        <div class="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 shadow-sm">
          <div class="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center animate-bounce-in">
            <span class="text-2xl">{{ event.icon }}</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-amber-600 uppercase tracking-wide">Logro desbloqueado</p>
            <p class="text-sm font-bold text-gray-900">{{ event.title }}</p>
            <p class="text-xs text-amber-700 font-medium">+{{ event.xpReward }} XP</p>
          </div>
        </div>
      </div>
    }
  `,
})
export class AchievementToastComponent {
  gamificationService = inject(GamificationService);
}
