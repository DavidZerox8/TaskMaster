import { Component, ChangeDetectionStrategy, OnInit, inject, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RoutineService } from '../../../../core/services/routine.service';
import { RoutineInstanceService } from '../../../../core/services/routine-instance.service';
import {
  RoutineInstance,
  RoutineWithStats,
  isDailySchedule,
  isMonthlySchedule,
  isWeeklySchedule,
} from '../../../../models/routine.model';
import { TaskRowComponent } from '../../components/task-row/task-row.component';
import { CompletionRingComponent } from '../../../../shared/components/ui/completion-ring/completion-ring.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { firstValueFrom } from 'rxjs';

interface RoutineGroup {
  key: 'morning' | 'afternoon' | 'evening' | 'flexible';
  label: string;
  emoji: string;
  items: RoutineWithStats[];
}

@Component({
  selector: 'app-routines-today-page',
  standalone: true,
  imports: [RouterLink, TaskRowComponent, CompletionRingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in pb-24">
      <header class="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-6 text-white shadow-lg">
        <p class="text-sm text-white/80">{{ greeting() }}</p>
        <h1 class="text-2xl font-bold mt-0.5">Tu dia, paso a paso</h1>
        <div class="mt-4 grid grid-cols-3 gap-3">
          <div class="rounded-xl bg-white/15 backdrop-blur p-3">
            <p class="text-xs text-white/75">Programadas</p>
            <p class="text-2xl font-bold">{{ todayList().length }}</p>
          </div>
          <div class="rounded-xl bg-white/15 backdrop-blur p-3">
            <p class="text-xs text-white/75">Completadas</p>
            <p class="text-2xl font-bold">{{ completedCount() }}</p>
          </div>
          <div class="rounded-xl bg-white/15 backdrop-blur p-3">
            <p class="text-xs text-white/75">Progreso</p>
            <p class="text-2xl font-bold">{{ overallProgress() }}%</p>
          </div>
        </div>
      </header>

      @if (todayList().length === 0) {
        <app-empty-state
          icon="🌤️"
          title="Dia libre"
          message="No tienes rutinas programadas para hoy."
          actionLabel="Ver todas"
          (actionClicked)="goAll()" />
      }

      @for (group of groupedToday(); track group.key) {
        @if (group.items.length > 0) {
          <section class="space-y-3">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <span aria-hidden="true">{{ group.emoji }}</span>
              {{ group.label }}
              <span class="text-gray-400 font-normal">· {{ group.items.length }}</span>
            </h2>
            <div class="space-y-3">
              @for (routine of group.items; track routine.id) {
                @let instance = instanceFor(routine.id);
                <article
                  class="bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all p-4 space-y-3">
                  <header class="flex items-start gap-3">
                    @if (routine.icon) {
                      <span class="text-2xl shrink-0">{{ routine.icon }}</span>
                    }
                    <div class="flex-1 min-w-0">
                      <a [routerLink]="['/routines', routine.id]"
                         class="font-semibold text-gray-900 hover:text-indigo-700 truncate block">
                        {{ routine.name }}
                      </a>
                      <p class="text-xs text-gray-500 mt-0.5">
                        {{ scheduleHint(routine) }} · {{ routine.tasks.length }} {{ routine.tasks.length === 1 ? 'tarea' : 'tareas' }}
                      </p>
                    </div>
                    <div [style.color]="routine.color || '#6366f1'">
                      <app-completion-ring [value]="instance?.completionScore ?? 0" [size]="48" />
                    </div>
                  </header>

                  @if (routine.tasks.length > 0) {
                    <div class="space-y-2">
                      @for (task of routine.tasks; track task.id) {
                        <app-task-row
                          [task]="task"
                          [completed]="isTaskCompleted(routine.id, task.id)"
                          (toggle)="onToggle(routine.id, task.id)" />
                      }
                    </div>
                  } @else {
                    <p class="text-xs text-gray-400 italic">Sin tareas. Toca para configurar.</p>
                  }
                </article>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
})
export class RoutinesTodayPageComponent implements OnInit {
  private readonly routineService = inject(RoutineService);
  private readonly instanceService = inject(RoutineInstanceService);
  private readonly router = inject(Router);

  protected readonly todayList = computed(() => {
    const todayIds = new Set(this.routineService.todayRoutines().map(r => r.id));
    return this.routineService.routinesWithStats().filter(r => todayIds.has(r.id));
  });

  private readonly _instancesByRoutine = signal<Map<string, RoutineInstance>>(new Map());
  protected readonly instancesByRoutine = this._instancesByRoutine.asReadonly();

  protected readonly groupedToday = computed<RoutineGroup[]>(() => {
    const list = this.todayList();
    const groups: RoutineGroup[] = [
      { key: 'morning', label: 'Manana', emoji: '🌅', items: [] },
      { key: 'afternoon', label: 'Tarde', emoji: '☀️', items: [] },
      { key: 'evening', label: 'Noche', emoji: '🌙', items: [] },
      { key: 'flexible', label: 'Flexible', emoji: '🌀', items: [] },
    ];
    for (const r of list) {
      const hour = this.scheduleHourOrNull(r);
      if (hour === null) groups[3].items.push(r);
      else if (hour < 12) groups[0].items.push(r);
      else if (hour < 18) groups[1].items.push(r);
      else groups[2].items.push(r);
    }
    return groups;
  });

  protected readonly completedCount = computed(() => {
    const list = this.todayList();
    let n = 0;
    for (const r of list) {
      const inst = this.instanceFor(r.id);
      if (inst && inst.completionScore >= 100) n += 1;
    }
    return n;
  });

  protected readonly overallProgress = computed(() => {
    const list = this.todayList();
    if (list.length === 0) return 0;
    let sum = 0;
    for (const r of list) {
      const inst = this.instanceFor(r.id);
      sum += inst?.completionScore ?? 0;
    }
    return Math.round(sum / list.length);
  });

  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    const formatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const dateStr = formatter.format(new Date());
    if (h < 12) return `Buenos dias · ${dateStr}`;
    if (h < 19) return `Buenas tardes · ${dateStr}`;
    return `Buenas noches · ${dateStr}`;
  });

  async ngOnInit(): Promise<void> {
    this.routineService.loadAll();
    this.instanceService.loadAll();
    await new Promise(r => setTimeout(r, 250));
    const today = new Date();
    const map = new Map<string, RoutineInstance>();
    for (const r of this.routineService.todayRoutines()) {
      const instance = await firstValueFrom(this.instanceService.getOrCreateForDate(r.id, today));
      map.set(r.id, instance);
    }
    this._instancesByRoutine.set(map);
  }

  instanceFor(routineId: string): RoutineInstance | undefined {
    return this._instancesByRoutine().get(routineId);
  }

  isTaskCompleted(routineId: string, taskId: string): boolean {
    const instance = this.instanceFor(routineId);
    if (!instance) return false;
    return this.instanceService.isTaskCompleted(instance.id, taskId);
  }

  async onToggle(routineId: string, taskId: string): Promise<void> {
    const instance = this.instanceFor(routineId);
    if (!instance) return;
    const result = await firstValueFrom(
      this.instanceService.toggleTaskCompletion(instance.id, taskId),
    );
    this._instancesByRoutine.update(map => {
      const next = new Map(map);
      next.set(routineId, result.instance);
      return next;
    });
  }

  goAll(): void {
    this.router.navigate(['/routines']);
  }

  scheduleHint(routine: RoutineWithStats): string {
    const cfg = routine.scheduleConfig;
    if (isDailySchedule(cfg)) return cfg.timeWindowStart ? `Diario · ${cfg.timeWindowStart}` : 'Diario';
    if (isWeeklySchedule(cfg)) return cfg.timeWindowStart ?? 'Semanal';
    if (isMonthlySchedule(cfg)) return cfg.timeWindowStart ?? `Dia ${cfg.dayOfMonth}`;
    return 'Personalizado';
  }

  private scheduleHourOrNull(routine: RoutineWithStats): number | null {
    const cfg = routine.scheduleConfig;
    let timeWindow: string | undefined;
    if (isDailySchedule(cfg)) timeWindow = cfg.timeWindowStart;
    else if (isWeeklySchedule(cfg)) timeWindow = cfg.timeWindowStart;
    else if (isMonthlySchedule(cfg)) timeWindow = cfg.timeWindowStart;
    if (!timeWindow) return null;
    const h = Number(timeWindow.split(':')[0]);
    return Number.isNaN(h) ? null : h;
  }
}
