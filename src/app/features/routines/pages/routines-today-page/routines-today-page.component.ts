import { Component, ChangeDetectionStrategy, OnInit, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoutineService } from '../../../../core/services/routine.service';
import { RoutineInstanceService } from '../../../../core/services/routine-instance.service';
import { RoutineInstance, Task } from '../../../../models/routine.model';
import { TaskRowComponent } from '../../components/task-row/task-row.component';
import { CompletionRingComponent } from '../../../../shared/components/ui/completion-ring/completion-ring.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { formatLocalDate } from '../../../../core/utils/routine-schedule.utils';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-routines-today-page',
  standalone: true,
  imports: [RouterLink, TaskRowComponent, CompletionRingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in pb-24">
      <header>
        <h1 class="text-2xl font-bold text-gray-900">Hoy</h1>
        <p class="text-sm text-gray-500 mt-1">{{ today }} · {{ todayList().length }} rutinas programadas</p>
      </header>

      @if (todayList().length === 0) {
        <app-empty-state
          icon="🌤️"
          title="Día libre"
          message="No tienes rutinas programadas para hoy."
          actionLabel="Ver todas"
          (actionClicked)="goAll()" />
      }

      @for (routine of todayList(); track routine.id) {
        @let instance = instanceFor(routine.id);
        <section class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <header class="flex items-start gap-3">
            @if (routine.icon) {
              <span class="text-2xl shrink-0">{{ routine.icon }}</span>
            }
            <div class="flex-1 min-w-0">
              <a [routerLink]="['/routines', routine.id]" class="font-semibold text-gray-900 hover:text-indigo-700 truncate block">{{ routine.name }}</a>
              <p class="text-xs text-gray-500">{{ routine.tasks.length }} tareas</p>
            </div>
            <div [style.color]="routine.color || '#6366f1'">
              <app-completion-ring [value]="instance?.completionScore ?? 0" [size]="44" />
            </div>
          </header>

          <div class="space-y-2">
            @for (task of routine.tasks; track task.id) {
              <app-task-row
                [task]="task"
                [completed]="isTaskCompleted(routine.id, task.id)"
                (toggle)="onToggle(routine.id, task.id)" />
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class RoutinesTodayPageComponent implements OnInit {
  private readonly routineService = inject(RoutineService);
  private readonly instanceService = inject(RoutineInstanceService);

  protected readonly today = formatLocalDate(new Date());

  protected readonly todayList = computed(() => {
    const todayIds = new Set(this.routineService.todayRoutines().map(r => r.id));
    return this.routineService.routinesWithStats().filter(r => todayIds.has(r.id));
  });

  private readonly _instancesByRoutine = signal<Map<string, RoutineInstance>>(new Map());
  protected readonly instancesByRoutine = this._instancesByRoutine.asReadonly();

  async ngOnInit(): Promise<void> {
    this.routineService.loadAll();
    this.instanceService.loadAll();
    // Wait briefly for routine load before generating today's instances
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
    history.pushState({}, '', '/routines');
  }
}
