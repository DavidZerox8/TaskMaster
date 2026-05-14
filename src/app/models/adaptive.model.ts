export enum AdaptiveSuggestionType {
  TIME_WINDOW_ADJUST = 'time_window_adjust',
  STREAK_CELEBRATION = 'streak_celebration',
  MISSED_ROUTINE = 'missed_routine',
  TASK_REORDER = 'task_reorder',
}

export enum AdaptiveSuggestionStatus {
  PROPOSED = 'proposed',
  ACCEPTED = 'accepted',
  DISMISSED = 'dismissed',
  REVERTED = 'reverted',
}

export interface TimeWindowAdjustPayload {
  type: 'time_window_adjust';
  currentStart?: string;
  currentEnd?: string;
  proposedStart: string;
  proposedEnd?: string;
  reason: string;
  sampleSize: number;
}

export interface StreakCelebrationPayload {
  type: 'streak_celebration';
  currentStreak: number;
  milestone: number;
  message?: string;
}

export interface MissedRoutinePayload {
  type: 'missed_routine';
  daysMissed: number;
  lastCompletedAt?: string;
  encouragement?: string;
}

export interface TaskReorderPayload {
  type: 'task_reorder';
  proposedOrder: string[];
  reason: string;
}

export type AdaptiveSuggestionPayload =
  | TimeWindowAdjustPayload
  | StreakCelebrationPayload
  | MissedRoutinePayload
  | TaskReorderPayload;

export interface AdaptiveSuggestion {
  id: string;
  userId: string;
  routineId: string;
  type: AdaptiveSuggestionType;
  payload: AdaptiveSuggestionPayload;
  status: AdaptiveSuggestionStatus;
  createdAt: Date;
  resolvedAt?: Date;
  appliedSnapshot?: Record<string, unknown>;
}

export interface AdaptiveSuggestionCreateRequest {
  routineId: string;
  type: AdaptiveSuggestionType;
  payload: AdaptiveSuggestionPayload;
}

export interface AdaptiveSuggestionUpdateRequest {
  status?: AdaptiveSuggestionStatus;
  resolvedAt?: Date;
  appliedSnapshot?: Record<string, unknown>;
}

export const ADAPTIVE_SUGGESTION_TYPE_LABELS: Record<AdaptiveSuggestionType, string> = {
  [AdaptiveSuggestionType.TIME_WINDOW_ADJUST]: 'Ajuste de horario',
  [AdaptiveSuggestionType.STREAK_CELEBRATION]: 'Celebracion de racha',
  [AdaptiveSuggestionType.MISSED_ROUTINE]: 'Rutina perdida',
  [AdaptiveSuggestionType.TASK_REORDER]: 'Reorden de tareas',
};
