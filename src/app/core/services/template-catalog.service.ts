import { Injectable } from '@angular/core';
import { DayOfWeek } from '../../models/habit.model';
import { RoutineCreateRequest, ScheduleType } from '../../models/routine.model';

export interface RoutineTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly category: 'health' | 'productivity' | 'mindfulness' | 'fitness' | 'learning' | 'social';
  /** Materializable into a `RoutineCreateRequest` via `toCreateRequest()`. */
  readonly request: RoutineCreateRequest;
}

const WEEKDAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

const TEMPLATES: ReadonlyArray<RoutineTemplate> = [
  {
    id: 'morning-routine',
    name: 'Rutina matinal',
    description: 'Hidrátate, muévete, enfoca tu mente.',
    icon: '🌅',
    category: 'health',
    request: {
      name: 'Rutina matinal',
      icon: '🌅',
      scheduleType: ScheduleType.DAILY,
      scheduleConfig: { type: 'daily', timeWindowStart: '06:00', timeWindowEnd: '09:00' },
      tasks: [
        { name: 'Vaso de agua', order: 1, defaultDurationMinutes: 1 },
        { name: 'Estiramiento 5 min', order: 2, defaultDurationMinutes: 5 },
        { name: 'Meditación 10 min', order: 3, defaultDurationMinutes: 10 },
      ],
    },
  },
  {
    id: 'evening-winddown',
    name: 'Bajada nocturna',
    description: 'Apaga el ruido antes de dormir.',
    icon: '🌙',
    category: 'mindfulness',
    request: {
      name: 'Bajada nocturna',
      icon: '🌙',
      scheduleType: ScheduleType.DAILY,
      scheduleConfig: { type: 'daily', timeWindowStart: '21:00', timeWindowEnd: '23:00' },
      tasks: [
        { name: 'Pantallas fuera', order: 1, defaultDurationMinutes: 1 },
        { name: 'Lectura 20 min', order: 2, defaultDurationMinutes: 20 },
        { name: 'Journaling 5 min', order: 3, defaultDurationMinutes: 5 },
      ],
    },
  },
  {
    id: 'workout',
    name: 'Entrenamiento',
    description: 'Fuerza, técnica, descanso.',
    icon: '💪',
    category: 'fitness',
    request: {
      name: 'Entrenamiento',
      icon: '💪',
      scheduleType: ScheduleType.WEEKLY,
      scheduleConfig: {
        type: 'weekly',
        days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
        timeWindowStart: '17:00',
        timeWindowEnd: '19:00',
      },
      tasks: [
        { name: 'Warm-up', order: 1, defaultDurationMinutes: 10 },
        { name: 'Fuerza principal', order: 2, defaultDurationMinutes: 35 },
        { name: 'Cool-down', order: 3, defaultDurationMinutes: 10 },
      ],
    },
  },
  {
    id: 'deep-work',
    name: 'Bloque de trabajo profundo',
    description: 'Una tarea, sin distracciones.',
    icon: '🧠',
    category: 'productivity',
    request: {
      name: 'Trabajo profundo',
      icon: '🧠',
      scheduleType: ScheduleType.WEEKLY,
      scheduleConfig: { type: 'weekly', days: WEEKDAYS, timeWindowStart: '09:00', timeWindowEnd: '12:00' },
      tasks: [
        { name: 'Teléfono fuera de la vista', order: 1, defaultDurationMinutes: 1 },
        { name: 'Focus 25 min #1', order: 2, defaultDurationMinutes: 25 },
        { name: 'Pausa 5 min', order: 3, defaultDurationMinutes: 5 },
        { name: 'Focus 25 min #2', order: 4, defaultDurationMinutes: 25 },
      ],
    },
  },
  {
    id: 'hydration',
    name: 'Hidratación',
    description: '8 vasos a lo largo del día.',
    icon: '💧',
    category: 'health',
    request: {
      name: 'Hidratación',
      icon: '💧',
      scheduleType: ScheduleType.DAILY,
      scheduleConfig: { type: 'daily' },
      tasks: [
        { name: 'Vaso 1', order: 1 },
        { name: 'Vaso 2', order: 2 },
        { name: 'Vaso 3', order: 3 },
        { name: 'Vaso 4', order: 4 },
        { name: 'Vaso 5', order: 5 },
        { name: 'Vaso 6', order: 6 },
        { name: 'Vaso 7', order: 7 },
        { name: 'Vaso 8', order: 8 },
      ],
    },
  },
  {
    id: 'gratitude',
    name: 'Gratitud',
    description: 'Tres cosas, cada día.',
    icon: '🙏',
    category: 'mindfulness',
    request: {
      name: 'Gratitud',
      icon: '🙏',
      scheduleType: ScheduleType.DAILY,
      scheduleConfig: { type: 'daily' },
      tasks: [
        { name: 'Cosa 1', order: 1 },
        { name: 'Cosa 2', order: 2 },
        { name: 'Cosa 3', order: 3 },
      ],
    },
  },
  {
    id: 'weekly-review',
    name: 'Revisión semanal',
    description: 'Domingos: revisar, planear.',
    icon: '📋',
    category: 'productivity',
    request: {
      name: 'Revisión semanal',
      icon: '📋',
      scheduleType: ScheduleType.WEEKLY,
      scheduleConfig: { type: 'weekly', days: [DayOfWeek.SUNDAY] },
      tasks: [
        { name: 'Revisar semana', order: 1, defaultDurationMinutes: 15 },
        { name: 'Planear próxima', order: 2, defaultDurationMinutes: 15 },
        { name: 'Limpiar inbox', order: 3, defaultDurationMinutes: 10 },
      ],
    },
  },
  {
    id: 'reading',
    name: 'Lectura',
    description: '15 minutos de libro al día.',
    icon: '📚',
    category: 'learning',
    request: {
      name: 'Lectura',
      icon: '📚',
      scheduleType: ScheduleType.DAILY,
      scheduleConfig: { type: 'daily', timeWindowStart: '20:00', timeWindowEnd: '22:00' },
      tasks: [{ name: 'Leer 15 min', order: 1, defaultDurationMinutes: 15 }],
    },
  },
  {
    id: 'cold-breath',
    name: 'Ducha fría + respiración',
    description: 'Disciplina termodinámica.',
    icon: '❄️',
    category: 'health',
    request: {
      name: 'Ducha fría + respiración',
      icon: '❄️',
      scheduleType: ScheduleType.DAILY,
      scheduleConfig: { type: 'daily', timeWindowStart: '06:30', timeWindowEnd: '08:00' },
      tasks: [
        { name: 'Respiración 3 min', order: 1, defaultDurationMinutes: 3 },
        { name: 'Ducha fría 90s', order: 2, defaultDurationMinutes: 2 },
      ],
    },
  },
  {
    id: 'stack-morning',
    name: 'Stack post-entreno',
    description: 'Cadena de hábitos: ducha → café → plan.',
    icon: '⛓️',
    category: 'productivity',
    request: {
      name: 'Stack post-entreno',
      icon: '⛓️',
      scheduleType: ScheduleType.WEEKLY,
      scheduleConfig: {
        type: 'weekly',
        days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
        timeWindowStart: '07:00',
        timeWindowEnd: '09:00',
      },
      tasks: [
        { name: 'Ducha', order: 1, defaultDurationMinutes: 8 },
        { name: 'Café', order: 2, defaultDurationMinutes: 5 },
        { name: 'Planear día (top 3)', order: 3, defaultDurationMinutes: 5 },
      ],
    },
  },
];

@Injectable({ providedIn: 'root' })
export class TemplateCatalogService {
  getAll(): ReadonlyArray<RoutineTemplate> {
    return TEMPLATES;
  }

  getById(id: string): RoutineTemplate | undefined {
    return TEMPLATES.find((t) => t.id === id);
  }

  /** Returns `RoutineCreateRequest` instances ready for `RoutineService.create(...)`. */
  toCreateRequests(ids: ReadonlyArray<string>): RoutineCreateRequest[] {
    return ids
      .map((id) => this.getById(id)?.request)
      .filter((r): r is RoutineCreateRequest => r !== undefined);
  }
}
