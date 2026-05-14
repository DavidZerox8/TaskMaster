import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShellComponent } from './shared/components/layout/app-shell/app-shell.component';
import { ToastComponent } from './shared/components/ui/toast/toast.component';
import { XpPopupComponent } from './shared/components/ui/xp-popup/xp-popup.component';
import { LevelUpModalComponent } from './shared/components/ui/level-up-modal/level-up-modal.component';
import { AchievementToastComponent } from './shared/components/ui/achievement-toast/achievement-toast.component';
import { AICoachChatComponent } from './shared/components/ui/ai-coach-chat/ai-coach-chat.component';
import { AdaptiveRecommendationsService } from './core/services/adaptive-recommendations.service';

const ADAPTIVE_INTERVAL_MS = 30 * 60 * 1000;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, AppShellComponent, ToastComponent,
    XpPopupComponent, LevelUpModalComponent, AchievementToastComponent,
    AICoachChatComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-shell>
      <router-outlet />
    </app-shell>
    <app-toast />
    <app-xp-popup />
    <app-level-up-modal />
    <app-achievement-toast />
    <app-ai-coach-chat />
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly adaptiveService = inject(AdaptiveRecommendationsService);
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private readonly visibilityHandler = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      this.runAdaptive();
    }
  };

  ngOnInit(): void {
    this.adaptiveService.loadOpen();
    this.runAdaptive();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
    this.intervalHandle = setInterval(() => this.runAdaptive(), ADAPTIVE_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.intervalHandle !== null) clearInterval(this.intervalHandle);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  private runAdaptive(): void {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    this.adaptiveService.runAll().subscribe();
  }
}
