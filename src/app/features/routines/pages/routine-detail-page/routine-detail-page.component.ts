import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RoutineService } from '../../../../core/services/routine.service';
import { RoutineInstanceService } from '../../../../core/services/routine-instance.service';
import { RoutineInstance, RoutineInstanceStatus } from '../../../../models/routine.model';
import { TaskRowComponent } from '../../components/task-row/task-row.component';
import { CompletionRingComponent } from '../../../../shared/components/ui/completion-ring/completion-ring.component';
import { StreakBadgeComponent } from '../../../../shared/components/ui/streak-badge/streak-badge.component';

@Component({
  selector: 'app-routine-detail-page',
  standalone: true,
  imports: [RouterLink, TaskRowComponent, CompletionRingComponent, StreakBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (routine(); as r) {
      <div class="space-y-6 animate-fade-in pb-24">
        <header class="flex items-center gap-3">
          <a routerLink="/routines" class="text-gray-400 hover:text-gray-700">←</a>
          <span class="text-3xl">{{ r.icon || '🎯' }}</span>
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-bold text-gray-900 truncate">{{ r.name }}</h1>
            @if (r.description) {
              <p class="text-sm text-gray-500">{{ r.description }}</p>
            }
          </div>
          <a [routerLink]="['/routines', r.id, 'edit']" class="text-sm text-indigo-600 hover:text-indigo-800">Editar</a>
        </header>

        <section class="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
          <div [style.color]="r.color || '#6366f1'">
            <app-completion-ring [value]="instance()?.completionScore ?? 0" [size]="64" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-500">Estado de hoy</p>
            <p class="font-semibold text-gray-900">{{ statusLabel() }}</p>
            <div class="mt-1">
              <app-streak-badge [count]="r.streak.currentStreak" label="días" />
            </div>
          </div>
        </section>

        <section class="space-y-2">
          <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tareas</h2>
          @if (r.tasks.length === 0) {
            <p class="text-sm text-gray-500">Sin tareas. <a [routerLink]="['/routines', r.id, 'edit']" class="text-indigo-600">Añade alguna →</a></p>
          }
          @for (task of r.tasks; track task.id) {
            <app-task-row
              [task]="task"
              [completed]="taskCompleted(task.id)"
              (toggle)="onToggle(task.id)" />
          }
        </section>

        <footer class="flex gap-2">
          <button type="button" (click)="onSkip()" class="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Omitir hoy
          </button>
          <button type="button" (click)="onDelete()" class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
            Eliminar
          </button>
        </footer>
      </div>
    } @else {
      <p class="text-gray-500 text-center py-12">Cargando rutina…</p>
    }
  `,
})
export class RoutineDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly routineService = inject(RoutineService);
  private readonly instanceService = inject(RoutineInstanceService);

  protected readonly routineId = signal<string>('');
  protected readonly instance = signal<RoutineInstance | null>(null);

  protected readonly routine = computed(() =>
    this.routineService.routinesWithStats().find(r => r.id === this.routineId()),
  );

  protected readonly statusLabel = computed(() => {
    const status = this.instance()?.status ?? RoutineInstanceStatus.PENDING;
    switch (status) {
      case RoutineInstanceStatus.COMPLETED: return 'Completada hoy';
      case RoutineInstanceStatus.IN_PROGRESS: return 'En progreso';
      case RoutineInstanceStatus.SKIPPED: return 'Omitida';
      case RoutineInstanceStatus.MISSED: return 'Perdida';
      default: return 'Pendiente';
    }
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.routineId.set(id);
    this.routineService.loadAll();
    this.instanceService.loadAll();
    await new Promise(r => setTimeout(r, 250));
    if (id) {
      const instance = await firstValueFrom(
        this.instanceService.getOrCreateForDate(id, new Date()),
      );
      this.instance.set(instance);
    }
  }

  taskCompleted(taskId: string): boolean {
    const inst = this.instance();
    if (!inst) return false;
    return this.instanceService.isTaskCompleted(inst.id, taskId);
  }

  async onToggle(taskId: string): Promise<void> {
    const inst = this.instance();
    if (!inst) return;
    const result = await firstValueFrom(
      this.instanceService.toggleTaskCompletion(inst.id, taskId),
    );
    this.instance.set(result.instance);
  }

  async onSkip(): Promise<void> {
    const inst = this.instance();
    if (!inst) return;
    const skipped = await firstValueFrom(this.instanceService.skip(inst.id));
    this.instance.set(skipped);
  }

  async onDelete(): Promise<void> {
    const id = this.routineId();
    if (!id) return;
    if (!confirm('¿Eliminar esta rutina?')) return;
    await firstValueFrom(this.routineService.delete(id));
    this.router.navigate(['/routines']);
  }
}
