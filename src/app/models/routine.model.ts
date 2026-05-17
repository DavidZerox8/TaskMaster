import { DayOfWeek } from './habit.model';

export enum ScheduleType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM_CRON = 'custom_cron',
}

export interface DailyScheduleConfig {
  type: 'daily';
  timeWindowStart?: string;
  timeWindowEnd?: string;
}

export interface WeeklyScheduleConfig {
  type: 'weekly';
  days: DayOfWeek[];
  timeWindowStart?: string;
  timeWindowEnd?: string;
}

export interface MonthlyScheduleConfig {
  type: 'monthly';
  dayOfMonth: number;
  timeWindowStart?: string;
  timeWindowEnd?: string;
}

export interface CustomCronScheduleConfig {
  type: 'custom_cron';
  cron: string;
}

export type ScheduleConfig =
  | DailyScheduleConfig
  | WeeklyScheduleConfig
  | MonthlyScheduleConfig
  | CustomCronScheduleConfig;

export function isDailySchedule(config: ScheduleConfig): config is DailyScheduleConfig {
  return config.type === 'daily';
}

export function isWeeklySchedule(config: ScheduleConfig): config is WeeklyScheduleConfig {
  return config.type === 'weekly';
}

export function isMonthlySchedule(config: ScheduleConfig): config is MonthlyScheduleConfig {
  return config.type === 'monthly';
}

export function isCustomCronSchedule(config: ScheduleConfig): config is CustomCronScheduleConfig {
  return config.type === 'custom_cron';
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  scheduleType: ScheduleType;
  scheduleConfig: ScheduleConfig;
  active: boolean;
  sort: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  routineId: string;
  name: string;
  description?: string;
  order: number;
  defaultDurationMinutes?: number;
  suggestedTimeOfDay?: string;
}

export enum RoutineInstanceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  MISSED = 'missed',
}

export interface RoutineInstance {
  id: string;
  routineId: string;
  userId: string;
  date: string;
  status: RoutineInstanceStatus;
  openedAt?: Date;
  closedAt?: Date;
  completionScore: number;
}

export interface TaskCompletion {
  id: string;
  routineInstanceId: string;
  taskId: string;
  userId: string;
  completedAt: Date;
  durationSeconds?: number;
  skipped: boolean;
  note?: string;
}

export interface RoutineStreak {
  routineId: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: Date | null;
  celebrationPending: boolean;
}

export interface RoutineWithStats extends Routine {
  tasks: Task[];
  todayInstance?: RoutineInstance;
  streak: RoutineStreak;
  completionRate: number;
}

export interface RoutineCreateRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  scheduleType: ScheduleType;
  scheduleConfig: ScheduleConfig;
  sort?: number;
  tasks?: TaskCreateRequest[];
}

export interface RoutineUpdateRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  scheduleType?: ScheduleType;
  scheduleConfig?: ScheduleConfig;
  active?: boolean;
  sort?: number;
}

export interface TaskCreateRequest {
  name: string;
  description?: string;
  order: number;
  defaultDurationMinutes?: number;
  suggestedTimeOfDay?: string;
}

export interface TaskUpdateRequest {
  name?: string;
  description?: string;
  order?: number;
  defaultDurationMinutes?: number;
  suggestedTimeOfDay?: string;
}

export interface RoutineFilters {
  active?: boolean;
  scheduleType?: ScheduleType;
  searchTerm?: string;
}

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  [ScheduleType.DAILY]: 'Diario',
  [ScheduleType.WEEKLY]: 'Semanal',
  [ScheduleType.MONTHLY]: 'Mensual',
  [ScheduleType.CUSTOM_CRON]: 'Personalizado',
};

export const ROUTINE_INSTANCE_STATUS_LABELS: Record<RoutineInstanceStatus, string> = {
  [RoutineInstanceStatus.PENDING]: 'Pendiente',
  [RoutineInstanceStatus.IN_PROGRESS]: 'En progreso',
  [RoutineInstanceStatus.COMPLETED]: 'Completada',
  [RoutineInstanceStatus.SKIPPED]: 'Omitida',
  [RoutineInstanceStatus.MISSED]: 'Perdida',
};
