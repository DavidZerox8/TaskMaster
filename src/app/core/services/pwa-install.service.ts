import { Injectable, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'pwa.installDismissedAt';
const REPROMPT_AFTER_DAYS = 7;

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferred: BeforeInstallPromptEvent | null = null;
  private readonly availableSignal = signal(false);

  readonly canInstall = this.availableSignal.asReadonly();

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferred = e as BeforeInstallPromptEvent;
      if (!this.isRecentlyDismissed()) this.availableSignal.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.deferred = null;
      this.availableSignal.set(false);
    });
  }

  async prompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferred) return 'unavailable';
    await this.deferred.prompt();
    const choice = await this.deferred.userChoice;
    this.deferred = null;
    this.availableSignal.set(false);
    if (choice.outcome === 'dismissed') this.recordDismiss();
    return choice.outcome;
  }

  dismiss(): void {
    this.recordDismiss();
    this.availableSignal.set(false);
  }

  private recordDismiss(): void {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  private isRecentlyDismissed(): boolean {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) return false;
      const elapsed = Date.now() - Number(raw);
      return elapsed < REPROMPT_AFTER_DAYS * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }
}
