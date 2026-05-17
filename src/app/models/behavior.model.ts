export enum BehaviorEventType {
  ROUTINE_OPENED = 'routine_opened',
  TASK_CHECKED = 'task_checked',
  TASK_UNCHECKED = 'task_unchecked',
  ROUTINE_COMPLETED = 'routine_completed',
  ROUTINE_SKIPPED = 'routine_skipped',
  STREAK_CONTINUED = 'streak_continued',
  STREAK_BROKEN = 'streak_broken',
  REMINDER_DISMISSED = 'reminder_dismissed',
  REMINDER_ACTED = 'reminder_acted',
  TIME_WINDOW_ADJUSTED = 'time_window_adjusted',
  SUGGESTION_ACCEPTED = 'suggestion_accepted',
  SUGGESTION_DISMISSED = 'suggestion_dismissed',
}

export interface UserBehaviorEvent {
  id: string;
  userId: string;
  eventType: BehaviorEventType;
  eventData: Record<string, unknown>;
  occurredAt: Date;
}

export interface UserBehaviorEventInput {
  eventType: BehaviorEventType;
  eventData?: Record<string, unknown>;
  occurredAt?: Date;
}

export const BEHAVIOR_EVENT_TYPES: ReadonlySet<BehaviorEventType> = new Set(
  Object.values(BehaviorEventType),
);

export function isBehaviorEventType(value: unknown): value is BehaviorEventType {
  return typeof value === 'string' && BEHAVIOR_EVENT_TYPES.has(value as BehaviorEventType);
}
