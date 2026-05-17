import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  BehaviorEventType,
  UserBehaviorEventInput,
  isBehaviorEventType,
} from '../../models/behavior.model';
import { BEHAVIOR_REPOSITORY_TOKEN } from '../interfaces/behavior-repository.interface';

@Injectable({ providedIn: 'root' })
export class BehaviorTrackerService implements OnDestroy {
  private readonly repo = inject(BEHAVIOR_REPOSITORY_TOKEN);
  private readonly DEBOUNCE_MS = 1500;

  private queue: UserBehaviorEventInput[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly visibilityHandler = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      this.flush();
    }
  };

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    this.flush();
  }

  track(eventType: BehaviorEventType, eventData: Record<string, unknown> = {}): void {
    if (!isBehaviorEventType(eventType)) {
      console.warn(`BehaviorTracker: invalid event type "${eventType}" ignored`);
      return;
    }
    this.queue.push({ eventType, eventData, occurredAt: new Date() });
    this.scheduleFlush();
  }

  flush(): void {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.queue.length);
    this.repo.appendBatch(batch).subscribe({
      error: () => {
        // Restore queue on failure so events aren't lost
        this.queue.unshift(...batch);
      },
    });
  }

  pendingCount(): number {
    return this.queue.length;
  }

  private scheduleFlush(): void {
    if (this.flushTimer !== null) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, this.DEBOUNCE_MS);
  }
}
