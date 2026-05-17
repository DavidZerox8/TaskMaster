export enum ReminderChannel {
  PUSH = 'push',
  IN_APP = 'in_app',
  LOCAL = 'local',
}

export enum ReminderStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface ReminderPayload {
  title: string;
  message: string;
  motivational?: boolean;
}

export interface ReminderPreference {
  id: string;
  userId: string;
  routineId: string;
  channels: ReminderChannel[];
  leadMinutes: number;
  muteUntil?: Date;
}

export interface ScheduledReminder {
  id: string;
  userId: string;
  routineId: string;
  routineInstanceId?: string;
  sendAt: Date;
  channel: ReminderChannel;
  status: ReminderStatus;
  sentAt?: Date;
  payload: ReminderPayload;
}

export interface ReminderPreferenceCreateRequest {
  routineId: string;
  channels: ReminderChannel[];
  leadMinutes: number;
  muteUntil?: Date;
}

export interface ReminderPreferenceUpdateRequest {
  channels?: ReminderChannel[];
  leadMinutes?: number;
  muteUntil?: Date | null;
}

export interface ScheduledReminderCreateRequest {
  routineId: string;
  routineInstanceId?: string;
  sendAt: Date;
  channel: ReminderChannel;
  payload: ReminderPayload;
}

export interface ScheduledReminderUpdateRequest {
  status?: ReminderStatus;
  sentAt?: Date;
  sendAt?: Date;
  payload?: ReminderPayload;
}

export const REMINDER_CHANNEL_LABELS: Record<ReminderChannel, string> = {
  [ReminderChannel.PUSH]: 'Push',
  [ReminderChannel.IN_APP]: 'En app',
  [ReminderChannel.LOCAL]: 'Local',
};

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  [ReminderStatus.QUEUED]: 'En cola',
  [ReminderStatus.SENT]: 'Enviado',
  [ReminderStatus.FAILED]: 'Fallido',
  [ReminderStatus.CANCELLED]: 'Cancelado',
};
