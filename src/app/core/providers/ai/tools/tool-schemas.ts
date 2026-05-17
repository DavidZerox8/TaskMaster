import { AIToolDefinition } from '../../../../models/ai.model';

export const TOOL_CREATE_HABIT: AIToolDefinition = {
  name: 'create_habit',
  description: 'Crea un nuevo habito para el usuario. Usala cuando el usuario pida crear, agregar o empezar un habito nuevo. Solo envia los campos necesarios, el resto tiene defaults razonables.',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Nombre corto del habito (ej: "Meditar 10 minutos")' },
      description: { type: 'string', description: 'Descripcion opcional de 1 frase' },
      category: {
        type: 'string',
        description: 'Categoria del habito',
        enum: ['health', 'productivity', 'mindfulness', 'fitness', 'learning', 'social', 'finance', 'custom'],
      },
      type: {
        type: 'string',
        description: 'build = desarrollar un habito nuevo; break = dejar o reducir un habito existente',
        enum: ['build', 'break'],
      },
      frequency: {
        type: 'string',
        description: 'Con que frecuencia se realiza',
        enum: ['daily', 'weekdays', 'weekends', 'weekly'],
      },
      reminderTime: { type: 'string', description: 'Hora de recordatorio formato HH:mm (opcional)' },
      icon: { type: 'string', description: 'Emoji representativo (opcional)' },
    },
    required: ['title', 'category', 'type', 'frequency'],
  },
};

export const TOOL_ADJUST_HABIT: AIToolDefinition = {
  name: 'adjust_habit',
  description: 'Ajusta campos de un habito existente (titulo, descripcion, frecuencia, categoria, etc). Requiere el habitId del catalogo actual del usuario.',
  inputSchema: {
    type: 'object',
    properties: {
      habitId: { type: 'string', description: 'ID del habito a modificar (tomado del contexto)' },
      title: { type: 'string' },
      description: { type: 'string' },
      category: {
        type: 'string',
        enum: ['health', 'productivity', 'mindfulness', 'fitness', 'learning', 'social', 'finance', 'custom'],
      },
      frequency: {
        type: 'string',
        enum: ['daily', 'weekdays', 'weekends', 'weekly'],
      },
      reminderTime: { type: 'string', description: 'Formato HH:mm o vacio para quitar' },
      icon: { type: 'string' },
    },
    required: ['habitId'],
  },
};

export const TOOL_ARCHIVE_HABIT: AIToolDefinition = {
  name: 'archive_habit',
  description: 'Archiva un habito (lo saca de la lista activa sin borrar historial). Usala cuando el usuario pida pausar, archivar o dejar de seguir un habito.',
  inputSchema: {
    type: 'object',
    properties: {
      habitId: { type: 'string', description: 'ID del habito a archivar' },
    },
    required: ['habitId'],
  },
};

export const TOOL_CREATE_ROUTINE: AIToolDefinition = {
  name: 'create_routine',
  description: 'Crea una rutina nueva (con tareas opcionales). Usala cuando el usuario quiera estructurar varios pasos o un ritual diario/semanal. Cada tarea es un paso ordenado dentro de la rutina.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Nombre corto (ej: "Rutina matutina")' },
      description: { type: 'string', description: 'Descripcion opcional' },
      icon: { type: 'string', description: 'Emoji opcional' },
      color: { type: 'string', description: 'Color hex opcional (#RRGGBB)' },
      scheduleType: {
        type: 'string',
        description: 'Tipo de programacion',
        enum: ['daily', 'weekly', 'monthly', 'custom_cron'],
      },
      timeWindowStart: { type: 'string', description: 'Hora de inicio HH:mm (opcional)' },
      timeWindowEnd: { type: 'string', description: 'Hora de fin HH:mm (opcional)' },
      weeklyDays: {
        type: 'array',
        description: 'Dias de la semana (0=Dom, 6=Sab) si scheduleType=weekly',
        items: { type: 'number' },
      },
      dayOfMonth: {
        type: 'number',
        description: 'Dia del mes (1-31) si scheduleType=monthly',
      },
      cron: { type: 'string', description: 'Expresion cron si scheduleType=custom_cron' },
      tasks: {
        type: 'array',
        description: 'Lista ordenada de tareas. Cada tarea requiere name.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nombre de la tarea (requerido)' },
            description: { type: 'string' },
            defaultDurationMinutes: { type: 'number' },
            suggestedTimeOfDay: { type: 'string', description: 'HH:mm opcional' },
          },
        },
      },
    },
    required: ['name', 'scheduleType'],
  },
};

export const TOOL_COMPLETE_TASK: AIToolDefinition = {
  name: 'complete_task',
  description: 'Marca una tarea de hoy como completada. Toma el routineId y el taskId del contexto.',
  inputSchema: {
    type: 'object',
    properties: {
      routineId: { type: 'string', description: 'ID de la rutina' },
      taskId: { type: 'string', description: 'ID de la tarea a marcar' },
      note: { type: 'string', description: 'Nota opcional sobre la ejecucion' },
    },
    required: ['routineId', 'taskId'],
  },
};

export const TOOL_ACCEPT_TIME_WINDOW_ADJUSTMENT: AIToolDefinition = {
  name: 'accept_time_window_adjustment',
  description: 'Aplica una sugerencia adaptativa de ajuste de horario para una rutina (cambia el timeWindowStart al horario propuesto).',
  inputSchema: {
    type: 'object',
    properties: {
      suggestionId: { type: 'string', description: 'ID de la sugerencia adaptativa propuesta' },
    },
    required: ['suggestionId'],
  },
};

export const TOOL_DISMISS_ADAPTIVE_SUGGESTION: AIToolDefinition = {
  name: 'dismiss_adaptive_suggestion',
  description: 'Descarta una sugerencia adaptativa sin aplicarla.',
  inputSchema: {
    type: 'object',
    properties: {
      suggestionId: { type: 'string', description: 'ID de la sugerencia a descartar' },
    },
    required: ['suggestionId'],
  },
};

export const TOOL_CELEBRATE_STREAK: AIToolDefinition = {
  name: 'celebrate_streak',
  description: 'Marca como reconocida una celebracion de racha pendiente. Usala cuando el usuario celebre o reconozca su logro.',
  inputSchema: {
    type: 'object',
    properties: {
      suggestionId: { type: 'string', description: 'ID de la sugerencia de tipo streak_celebration' },
    },
    required: ['suggestionId'],
  },
};

export const AI_TOOL_CATALOG: AIToolDefinition[] = [
  TOOL_CREATE_HABIT,
  TOOL_ADJUST_HABIT,
  TOOL_ARCHIVE_HABIT,
  TOOL_CREATE_ROUTINE,
  TOOL_COMPLETE_TASK,
  TOOL_ACCEPT_TIME_WINDOW_ADJUSTMENT,
  TOOL_DISMISS_ADAPTIVE_SUGGESTION,
  TOOL_CELEBRATE_STREAK,
];
