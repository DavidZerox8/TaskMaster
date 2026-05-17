import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoutineWithStats, RoutineInstanceStatus, isDailySchedule, isWeeklySchedule, isMonthlySchedule } from '../../../../models/routine.model';
import { DAY_OF_WEEK_LABELS } from '../../../../models/habit.model';
import { CompletionRingComponent } from '../../../../shared/components/ui/completion-ring/completion-ring.component';
import { StreakBadgeComponent } from '../../../../shared/components/ui/streak-badge/streak-badge.component';

@Component({
  selector: 'app-routine-card',
  standalone: true,
  imports: [RouterLink, CompletionRingComponent, StreakBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all p-4 flex flex-col gap-3">
      <header class="flex items-start gap-3">
        @if (routine().icon) {
          <span class="text-2xl shrink-0" aria-hidden="true">{{ routine().icon }}</span>
        }
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-gray-900 truncate">{{ routine().name }}</h3>
          @if (routine().description) {
            <p class="text-xs text-gray-500 truncate">{{ routine().description }}</p>
          }
        </div>
        <div [style.color]="routine().color || '#6366f1'">
          <app-completion-ring [value]="ringValue()" [size]="44" />
        </div>
      </header>

      <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span class="px-2 py-0.5 bg-gray-100 rounded-full">{{ scheduleLabel() }}</span>
        <span class="px-2 py-0.5 bg-gray-100 rounded-full">{{ taskCount() }} {{ taskCount() === 1 ? 'tarea' : 'tareas' }}</span>
        <app-streak-badge [count]="routine().streak.currentStreak" />
        @if (statusLabel(); as s) {
          <span class="px-2 py-0.5 rounded-full" [class]="statusClass()">{{ s }}</span>
        }
      </div>

      <footer class="flex items-center justify-between mt-auto">
        <a [routerLink]="['/routines', routine().id]"
           class="text-xs font-medium text-indigo-600 hover:text-indigo-800">
          Ver detalle →
        </a>
        <button type="button"
                (click)="edit.emit(routine().id)"
                class="text-xs text-gray-500 hover:text-gray-800">
          Editar
        </button>
      </footer>
    </article>
  `,
})
export class RoutineCardComponent {
  readonly routine = input.required<RoutineWithStats>();
  readonly edit = output<string>();

  protected readonly ringValue = computed(() => this.routine().todayInstance?.completionScore ?? 0);
  protected readonly taskCount = computed(() => this.routine().tasks.length);

  protected readonly scheduleLabel = computed(() => {
    const config = this.routine().scheduleConfig;
    if (isDailySchedule(config)) {
      return config.timeWindowStart ? `Diario · ${config.timeWindowStart}` : 'Diario';
    }
    if (isWeeklySchedule(config)) {
      const days = config.days.map(d => DAY_OF_WEEK_LABELS[d].slice(0, 3)).join(', ');
      return days || 'Semanal';
    }
    if (isMonthlySchedule(config)) {
      return `Día ${config.dayOfMonth} del mes`;
    }
    return 'Personalizado';
  });

  protected readonly statusLabel = computed(() => {
    const status = this.routine().todayInstance?.status;
    switch (status) {
      case RoutineInstanceStatus.COMPLETED: return 'Hoy ✓';
      case RoutineInstanceStatus.IN_PROGRESS: return 'En progreso';
      case RoutineInstanceStatus.SKIPPED: return 'Omitida';
      case RoutineInstanceStatus.MISSED: return 'Perdida';
      default: return null;
    }
  });

  protected readonly statusClass = computed(() => {
    const status = this.routine().todayInstance?.status;
    switch (status) {
      case RoutineInstanceStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700';
      case RoutineInstanceStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700';
      case RoutineInstanceStatus.SKIPPED: return 'bg-gray-200 text-gray-700';
      case RoutineInstanceStatus.MISSED: return 'bg-red-100 text-red-700';
      default: return '';
    }
  });
}
