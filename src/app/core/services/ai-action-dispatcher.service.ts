import { Injectable, inject } from '@angular/core';
import { Observable, of, map, catchError, switchMap, forkJoin, throwError } from 'rxjs';
import { HabitService } from './habit.service';
import { RoutineService } from './routine.service';
import { RoutineInstanceService } from './routine-instance.service';
import { AdaptiveRecommendationsService } from './adaptive-recommendations.service';
import { ADAPTIVE_SUGGESTION_REPOSITORY_TOKEN } from '../interfaces/adaptive-suggestion-repository.interface';
import {
  AIToolCall,
  AIToolResult,
  AIActionChip,
} from '../../models/ai.model';
import {
  Habit,
  HabitCategory,
  HabitType,
  HabitFrequency,
  HabitCreateRequest,
  HabitUpdateRequest,
  DayOfWeek,
} from '../../models/habit.model';
import {
  Routine,
  RoutineCreateRequest,
  ScheduleConfig,
  ScheduleType,
  TaskCreateRequest,
} from '../../models/routine.model';
import {
  AdaptiveSuggestion,
  AdaptiveSuggestionStatus,
  AdaptiveSuggestionType,
} from '../../models/adaptive.model';
export interface AIDispatchOutcome {
  toolResult: AIToolResult;
  chip: AIActionChip;
}

@Injectable({ providedIn: 'root' })
export class AIActionDispatcherService {
  private habitService = inject(HabitService);
  private routineService = inject(RoutineService);
  private routineInstanceService = inject(RoutineInstanceService);
  private adaptiveService = inject(AdaptiveRecommendationsService);
  private suggestionRepo = inject(ADAPTIVE_SUGGESTION_REPOSITORY_TOKEN);

  execute(call: AIToolCall): Observable<AIDispatchOutcome> {
    switch (call.name) {
      case 'create_habit':
        return this.handleCreate(call);
      case 'adjust_habit':
        return this.handleAdjust(call);
      case 'archive_habit':
        return this.handleArchive(call);
      case 'create_routine':
        return this.handleCreateRoutine(call);
      case 'complete_task':
        return this.handleCompleteTask(call);
      case 'accept_time_window_adjustment':
        return this.handleAcceptTimeWindow(call);
      case 'dismiss_adaptive_suggestion':
        return this.handleDismissSuggestion(call);
      case 'celebrate_streak':
        return this.handleCelebrateStreak(call);
      default:
        return of(this.fail(call, `Herramienta no soportada: ${call.name}`));
    }
  }

  private handleCreate(call: AIToolCall): Observable<AIDispatchOutcome> {
    const req = this.buildCreateRequest(call.args);
    if (typeof req === 'string') return of(this.fail(call, req));

    return this.habitService.createHabitReturning(req).pipe(
      map(habit => this.success(call, '✨', `Habito creado: "${habit.title}"`, habit, {
        habitId: habit.id,
        title: habit.title,
        category: habit.category,
        frequency: habit.frequency,
      })),
      catchError(err => of(this.fail(call, this.errorMessage(err)))),
    );
  }

  private handleAdjust(call: AIToolCall): Observable<AIDispatchOutcome> {
    const habitId = this.asString(call.args['habitId']);
    if (!habitId) return of(this.fail(call, 'Falta habitId'));

    const existing = this.habitService.habits().find(h => h.id === habitId);
    if (!existing) return of(this.fail(call, `Habito no encontrado: ${habitId}`));

    const patch = this.buildUpdateRequest(call.args);
    if (Object.keys(patch).length === 0) {
      return of(this.fail(call, 'Nada que ajustar: pasa al menos un campo ademas de habitId'));
    }

    return this.habitService.updateHabitReturning(habitId, patch).pipe(
      map(habit => this.success(call, '🛠️', `Habito ajustado: "${habit.title}"`, habit, {
        habitId: habit.id,
        changes: patch,
      })),
      catchError(err => of(this.fail(call, this.errorMessage(err)))),
    );
  }

  private handleArchive(call: AIToolCall): Observable<AIDispatchOutcome> {
    const habitId = this.asString(call.args['habitId']);
    if (!habitId) return of(this.fail(call, 'Falta habitId'));

    const existing = this.habitService.habits().find(h => h.id === habitId);
    if (!existing) return of(this.fail(call, `Habito no encontrado: ${habitId}`));

    return this.habitService.archiveHabitReturning(habitId).pipe(
      map(habit => this.success(call, '📦', `Habito archivado: "${habit.title}"`, habit, {
        habitId: habit.id,
      })),
      catchError(err => of(this.fail(call, this.errorMessage(err)))),
    );
  }

  private buildCreateRequest(args: Record<string, unknown>): HabitCreateRequest | string {
    const title = this.asString(args['title']);
    const category = this.asEnum(args['category'], HabitCategory);
    const type = this.asEnum(args['type'], HabitType);
    const frequency = this.asEnum(args['frequency'], HabitFrequency);

    if (!title) return 'Falta title';
    if (!category) return 'Categoria invalida';
    if (!type) return 'Tipo invalido (build|break)';
    if (!frequency) return 'Frecuencia invalida';

    const req: HabitCreateRequest = { title, category, type, frequency };
    const description = this.asString(args['description']);
    if (description) req.description = description;
    const reminderTime = this.asString(args['reminderTime']);
    if (reminderTime) req.reminderTime = reminderTime;
    const icon = this.asString(args['icon']);
    if (icon) req.icon = icon;
    return req;
  }

  private buildUpdateRequest(args: Record<string, unknown>): HabitUpdateRequest {
    const patch: HabitUpdateRequest = {};
    const title = this.asString(args['title']);
    if (title) patch.title = title;
    const description = this.asString(args['description']);
    if (description !== null) patch.description = description ?? undefined;
    const category = this.asEnum(args['category'], HabitCategory);
    if (category) patch.category = category;
    const frequency = this.asEnum(args['frequency'], HabitFrequency);
    if (frequency) patch.frequency = frequency;
    if ('reminderTime' in args) {
      const rt = this.asString(args['reminderTime']);
      patch.reminderTime = rt ?? undefined;
    }
    const icon = this.asString(args['icon']);
    if (icon) patch.icon = icon;
    return patch;
  }

  private success(
    call: AIToolCall,
    icon: string,
    summary: string,
    habit: Habit,
    payload: Record<string, unknown>,
  ): AIDispatchOutcome {
    return this.successGeneric(call, icon, summary, payload, habit.id, `/habits/${habit.id}`);
  }

  private successGeneric(
    call: AIToolCall,
    icon: string,
    summary: string,
    payload: Record<string, unknown>,
    resourceId?: string,
    resourceRoute?: string,
  ): AIDispatchOutcome {
    return {
      toolResult: {
        toolCallId: call.id,
        toolName: call.name,
        content: JSON.stringify({ ok: true, ...payload }),
        isError: false,
      },
      chip: {
        id: call.id,
        toolName: call.name,
        icon,
        summary,
        status: 'success',
        resourceId,
        resourceRoute,
      },
    };
  }

  // ─── Routine handlers ──────────────────────────────────────────

  private handleCreateRoutine(call: AIToolCall): Observable<AIDispatchOutcome> {
    const req = this.buildRoutineCreateRequest(call.args);
    if (typeof req === 'string') return of(this.fail(call, req));

    return this.routineService.create(req).pipe(
      map(routine => this.successGeneric(call, '🗂️',
        `Rutina creada: "${routine.name}"`,
        {
          routineId: routine.id,
          name: routine.name,
          scheduleType: routine.scheduleType,
        },
        routine.id,
        `/routines/${routine.id}`,
      )),
      catchError(err => of(this.fail(call, this.errorMessage(err)))),
    );
  }

  private handleCompleteTask(call: AIToolCall): Observable<AIDispatchOutcome> {
    const routineId = this.asString(call.args['routineId']);
    const taskId = this.asString(call.args['taskId']);
    const note = this.asString(call.args['note']) ?? undefined;
    if (!routineId) return of(this.fail(call, 'Falta routineId'));
    if (!taskId) return of(this.fail(call, 'Falta taskId'));

    return this.routineInstanceService.getOrCreateForDate(routineId, new Date()).pipe(
      switchMap(instance => {
        if (this.routineInstanceService.isTaskCompleted(instance.id, taskId)) {
          return of(this.successGeneric(call, '✅',
            'La tarea ya estaba completada hoy',
            { routineId, taskId, alreadyCompleted: true },
            routineId,
            `/routines/${routineId}`,
          ));
        }
        return this.routineInstanceService
          .toggleTaskCompletion(instance.id, taskId, note)
          .pipe(
            map(({ completed }) => this.successGeneric(call, completed ? '✅' : '↩️',
              completed ? 'Tarea marcada como completada' : 'Tarea desmarcada',
              { routineId, taskId, completed },
              routineId,
              `/routines/${routineId}`,
            )),
          );
      }),
      catchError(err => of(this.fail(call, this.errorMessage(err)))),
    );
  }

  private handleAcceptTimeWindow(call: AIToolCall): Observable<AIDispatchOutcome> {
    const id = this.asString(call.args['suggestionId']);
    if (!id) return of(this.fail(call, 'Falta suggestionId'));

    return this.suggestionRepo.getById(id).pipe(
      switchMap(suggestion => {
        if (!suggestion) return throwError(() => new Error('Sugerencia no encontrada'));
        if (suggestion.type !== AdaptiveSuggestionType.TIME_WINDOW_ADJUST) {
          return throwError(() => new Error('Sugerencia no es de ajuste de horario'));
        }
        if (suggestion.status !== AdaptiveSuggestionStatus.PROPOSED) {
          return of(this.successGeneric(call, 'ℹ️',
            'La sugerencia ya estaba resuelta',
            { suggestionId: id, status: suggestion.status },
          ));
        }
        return this.adaptiveService.acceptSuggestion(suggestion).pipe(
          map(updated => this.successGeneric(call, '🕒',
            'Horario ajustado segun la sugerencia',
            { suggestionId: id, routineId: updated.routineId },
            updated.routineId,
            `/routines/${updated.routineId}`,
          )),
        );
      }),
      catchError(err => of(this.fail(call, this.errorMessage(err)))),
    );
  }

  private handleDismissSuggestion(call: AIToolCall): Observable<AIDispatchOutcome> {
    const id = this.asString(call.args['suggestionId']);
    if (!id) return of(this.fail(call, 'Falta suggestionId'));

    return this.adaptiveService.dismissSuggestion(id).pipe(
      map(updated => this.successGeneric(call, '✖️',
        'Sugerencia descartada',
        { suggestionId: id, routineId: updated.routineId, status: updated.status },
        updated.routineId,
        `/routines/${updated.routineId}`,
      )),
      catchError(err => of(this.fail(call, this.errorMessage(err)))),
    );
  }

  private handleCelebrateStreak(call: AIToolCall): Observable<AIDispatchOutcome> {
    const id = this.asString(call.args['suggestionId']);
    if (!id) return of(this.fail(call, 'Falta suggestionId'));

    return this.suggestionRepo.getById(id).pipe(
      switchMap(suggestion => {
        if (!suggestion) return throwError(() => new Error('Sugerencia no encontrada'));
        if (suggestion.type !== AdaptiveSuggestionType.STREAK_CELEBRATION) {
          return throwError(() => new Error('Sugerencia no es de racha'));
        }
        return this.adaptiveService.acceptSuggestion(suggestion).pipe(
          map(updated => this.successGeneric(call, '🎉',
            'Racha celebrada — sigue asi',
            {
              suggestionId: id,
              routineId: updated.routineId,
              streak: suggestion.payload.type === 'streak_celebration' ? suggestion.payload.currentStreak : null,
            },
            updated.routineId,
            `/routines/${updated.routineId}`,
          )),
        );
      }),
      catchError(err => of(this.fail(call, this.errorMessage(err)))),
    );
  }

  private buildRoutineCreateRequest(args: Record<string, unknown>): RoutineCreateRequest | string {
    const name = this.asString(args['name']);
    const scheduleTypeRaw = this.asString(args['scheduleType']);
    if (!name) return 'Falta name';
    if (!scheduleTypeRaw) return 'Falta scheduleType';

    const scheduleType = this.asEnum(scheduleTypeRaw, ScheduleType);
    if (!scheduleType) return 'scheduleType invalido (daily|weekly|monthly|custom_cron)';

    const description = this.asString(args['description']) ?? undefined;
    const icon = this.asString(args['icon']) ?? undefined;
    const color = this.asString(args['color']) ?? undefined;
    const timeWindowStart = this.asString(args['timeWindowStart']) ?? undefined;
    const timeWindowEnd = this.asString(args['timeWindowEnd']) ?? undefined;

    let scheduleConfig: ScheduleConfig;
    if (scheduleType === ScheduleType.DAILY) {
      scheduleConfig = { type: 'daily', timeWindowStart, timeWindowEnd };
    } else if (scheduleType === ScheduleType.WEEKLY) {
      const days = this.asDayOfWeekArray(args['weeklyDays']);
      if (days.length === 0) return 'weeklyDays vacio para scheduleType=weekly';
      scheduleConfig = { type: 'weekly', days, timeWindowStart, timeWindowEnd };
    } else if (scheduleType === ScheduleType.MONTHLY) {
      const dayOfMonth = this.asNumber(args['dayOfMonth']);
      if (dayOfMonth === null || dayOfMonth < 1 || dayOfMonth > 31) {
        return 'dayOfMonth invalido para scheduleType=monthly';
      }
      scheduleConfig = { type: 'monthly', dayOfMonth, timeWindowStart, timeWindowEnd };
    } else {
      const cron = this.asString(args['cron']);
      if (!cron) return 'cron requerido para scheduleType=custom_cron';
      scheduleConfig = { type: 'custom_cron', cron };
    }

    const tasks = this.asTaskList(args['tasks']);

    return {
      name,
      description,
      icon,
      color,
      scheduleType,
      scheduleConfig,
      tasks: tasks.length > 0 ? tasks : undefined,
    };
  }

  private asTaskList(value: unknown): TaskCreateRequest[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((entry, index) => {
        if (!entry || typeof entry !== 'object') return null;
        const e = entry as Record<string, unknown>;
        const name = this.asString(e['name']);
        if (!name) return null;
        const task: TaskCreateRequest = {
          name,
          order: index,
        };
        const description = this.asString(e['description']);
        if (description) task.description = description;
        const duration = this.asNumber(e['defaultDurationMinutes']);
        if (duration !== null) task.defaultDurationMinutes = duration;
        const suggested = this.asString(e['suggestedTimeOfDay']);
        if (suggested) task.suggestedTimeOfDay = suggested;
        return task;
      })
      .filter((t): t is TaskCreateRequest => t !== null);
  }

  private asDayOfWeekArray(value: unknown): DayOfWeek[] {
    if (!Array.isArray(value)) return [];
    const out: DayOfWeek[] = [];
    for (const v of value) {
      const n = this.asNumber(v);
      if (n === null) continue;
      if (n < 0 || n > 6) continue;
      out.push(n as DayOfWeek);
    }
    return Array.from(new Set(out));
  }

  private asNumber(value: unknown): number | null {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const n = Number(value);
      if (!Number.isNaN(n)) return n;
    }
    return null;
  }

  private fail(call: AIToolCall, message: string): AIDispatchOutcome {
    return {
      toolResult: {
        toolCallId: call.id,
        toolName: call.name,
        content: JSON.stringify({ ok: false, error: message }),
        isError: true,
      },
      chip: {
        id: call.id,
        toolName: call.name,
        icon: '⚠️',
        summary: `No se pudo ejecutar ${call.name}`,
        status: 'error',
        errorMessage: message,
      },
    };
  }

  private asString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }

  private asEnum<T extends Record<string, string>>(value: unknown, enumObj: T): T[keyof T] | null {
    if (typeof value !== 'string') return null;
    const v = value.toLowerCase();
    const match = Object.values(enumObj).find(e => e === v);
    return (match as T[keyof T]) ?? null;
  }

  private errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return 'Error desconocido';
  }
}
