import { TestBed } from '@angular/core/testing';
import { BehaviorTrackerService } from './behavior-tracker.service';
import { APP_REPOSITORY_PROVIDERS } from '../providers/app.providers';
import { BehaviorEventType } from '../../models/behavior.model';

describe('BehaviorTrackerService', () => {
  let tracker: BehaviorTrackerService;

  beforeEach(() => {
    localStorage.clear();
    jasmine.clock().install();
    TestBed.configureTestingModule({
      providers: [...APP_REPOSITORY_PROVIDERS],
    });
    tracker = TestBed.inject(BehaviorTrackerService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    localStorage.clear();
  });

  it('queues events and flushes after 1.5s debounce', () => {
    tracker.track(BehaviorEventType.ROUTINE_OPENED, { routineId: 'r1' });
    tracker.track(BehaviorEventType.TASK_CHECKED, { taskId: 't1' });
    expect(tracker.pendingCount()).toBe(2);

    jasmine.clock().tick(1500);
    expect(tracker.pendingCount()).toBe(0);

    const stored = JSON.parse(localStorage.getItem('behavior_events') ?? '[]');
    expect(stored.length).toBe(2);
    expect(stored.map((e: any) => e.eventType)).toEqual([
      BehaviorEventType.ROUTINE_OPENED,
      BehaviorEventType.TASK_CHECKED,
    ]);
  });

  it('coalesces multiple track calls into single batch', () => {
    tracker.track(BehaviorEventType.ROUTINE_OPENED);
    jasmine.clock().tick(500);
    tracker.track(BehaviorEventType.TASK_CHECKED);
    jasmine.clock().tick(500);
    tracker.track(BehaviorEventType.ROUTINE_COMPLETED);
    expect(tracker.pendingCount()).toBe(3);

    jasmine.clock().tick(1500);
    expect(tracker.pendingCount()).toBe(0);
  });

  it('rejects invalid event type without queueing', () => {
    spyOn(console, 'warn');
    tracker.track('NOT_AN_EVENT' as BehaviorEventType);
    expect(tracker.pendingCount()).toBe(0);
    expect(console.warn).toHaveBeenCalled();
  });

  it('flush() is idempotent when queue is empty', () => {
    expect(() => tracker.flush()).not.toThrow();
    expect(tracker.pendingCount()).toBe(0);
  });

  it('manual flush before debounce drains queue', () => {
    tracker.track(BehaviorEventType.STREAK_CONTINUED);
    expect(tracker.pendingCount()).toBe(1);
    tracker.flush();
    expect(tracker.pendingCount()).toBe(0);
  });

  it('flushes on visibilitychange to hidden', () => {
    tracker.track(BehaviorEventType.REMINDER_DISMISSED);
    expect(tracker.pendingCount()).toBe(1);
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(tracker.pendingCount()).toBe(0);
  });
});
