import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RoutineService } from '../../../../core/services/routine.service';
import { RoutineInstanceService } from '../../../../core/services/routine-instance.service';
import { AdaptiveRecommendationsService } from '../../../../core/services/adaptive-recommendations.service';
import { BehaviorTrackerService } from '../../../../core/services/behavior-tracker.service';
import {
  RoutineInstance,
  RoutineInstanceStatus,
  RoutineWithStats,
} from '../../../../models/routine.model';
import { AdaptiveSuggestion } from '../../../../models/adaptive.model';
import { BehaviorEventType } from '../../../../models/behavior.model';
import { TaskRowComponent } from '../../components/task-row/task-row.component';
import { CompletionRingComponent } from '../../../../shared/components/ui/completion-ring/completion-ring.component';
import { StreakBadgeComponent } from '../../../../shared/components/ui/streak-badge/streak-badge.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import { AdaptiveSuggestionCardComponent } from '../../components/adaptive-suggestion-card/adaptive-suggestion-card.component';

@Component({
  selector: 'app-routine-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    TaskRowComponent,
    CompletionRingComponent,
    StreakBadgeComponent,
    ModalComponent,
    AdaptiveSuggestionCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (routine(); as r) {
      <div class="pb-32 animate-fade-in">
        <!-- Hero header with color gradient -->
        <header
          class="relative overflow-hidden rounded-b-3xl px-5 pt-6 pb-10 text-white shadow-lg"
          [style.background]="heroGradient(r)">
          <div class="flex items-center gap-3">
            <a routerLink="/routines"
               class="w-9 h-9 grid place-items-center rounded-full bg-white/25 border border-white/40 hover:bg-white/35 transition-colors"
               aria-label="Volver">
              <span aria-hidden="true">←</span>
            </a>
            <div class="flex-1"></div>
            <a [routerLink]="['/routines', r.id, 'edit']"
               class="px-3 py-1.5 rounded-full bg-white/25 border border-white/40 hover:bg-white/35 text-sm font-medium">
              Editar
            </a>
          </div>

          <div class="mt-6 flex items-center gap-4">
            <span class="text-5xl drop-shadow" aria-hidden="true">{{ r.icon || '🎯' }}</span>
            <div class="flex-1 min-w-0">
              <h1 class="text-2xl font-bold leading-tight">{{ r.name }}</h1>
              @if (r.description) {
                <p class="text-sm text-white/85 mt-1 line-clamp-2">{{ r.description }}</p>
              }
            </div>
          </div>

          <div class="mt-5 flex items-center gap-4">
            <div class="text-white">
              <app-completion-ring [value]="instance()?.completionScore ?? 0" [size]="76" />
            </div>
            <div class="flex-1">
              <p class="text-xs uppercase tracking-wider text-white/75">Estado de hoy</p>
              <p class="text-base font-semibold">{{ statusLabel() }}</p>
              <div class="mt-1.5">
                <app-streak-badge [count]="r.streak.currentStreak" label="dias" />
              </div>
            </div>
          </div>
        </header>

        <div class="px-5 mt-6 space-y-6">
          <!-- Adaptive suggestions -->
          @if (suggestions().length > 0) {
            <section class="space-y-2">
              <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <span aria-hidden="true">💡</span>
                Sugerencias del coach
              </h2>
              <div class="space-y-2">
                @for (s of suggestions(); track s.id) {
                  <app-adaptive-suggestion-card
                    [suggestion]="s"
                    [busy]="suggestionBusy() === s.id"
                    (accept)="onAcceptSuggestion($event)"
                    (dismiss)="onDismissSuggestion($event)" />
                }
              </div>
            </section>
          }

          <!-- Tasks -->
          <section class="space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tareas</h2>
              @if (r.tasks.length > 0) {
                <span class="text-xs text-gray-500">{{ tasksDoneCount() }} / {{ r.tasks.length }}</span>
              }
            </div>
            @if (r.tasks.length === 0) {
              <div class="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center">
                <p class="text-sm text-gray-500">Sin tareas todavia.</p>
                <a [routerLink]="['/routines', r.id, 'edit']"
                   class="inline-block mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Anadir tareas →
                </a>
              </div>
            }
            @for (task of r.tasks; track task.id) {
              <app-task-row
                [task]="task"
                [completed]="taskCompleted(task.id)"
                (toggle)="onToggle(task.id)" />
            }
          </section>
        </div>

        <!-- Sticky action footer -->
        <footer class="fixed bottom-16 left-0 right-0 z-30 px-5 pb-4 md:bottom-4 md:left-64">
          <div class="max-w-3xl mx-auto flex gap-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-2">
            <button type="button"
                    (click)="onSkip()"
                    class="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
              Omitir hoy
            </button>
            <button type="button"
                    (click)="confirmDelete.set(true)"
                    class="px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              Eliminar
            </button>
          </div>
        </footer>

        <!-- Delete modal -->
        <app-modal [isOpen]="confirmDelete()" title="¿Eliminar rutina?" (closed)="confirmDelete.set(false)">
          <p class="text-sm text-gray-600">
            Esta accion eliminara <span class="font-semibold">"{{ r.name }}"</span> junto con sus tareas y registros. No se puede deshacer.
          </p>
          <div modal-footer class="flex justify-end gap-2">
            <button type="button"
                    (click)="confirmDelete.set(false)"
                    class="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
              Cancelar
            </button>
            <button type="button"
                    (click)="onDelete()"
                    class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700">
              Eliminar
            </button>
          </div>
        </app-modal>
      </div>
    } @else {
      <div class="flex flex-col items-center justify-center py-24 gap-3">
        <div class="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin"></div>
        <p class="text-sm text-gray-500">Cargando rutina…</p>
      </div>
    }
  `,
})
export class RoutineDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly routineService = inject(RoutineService);
  private readonly instanceService = inject(RoutineInstanceService);
  private readonly adaptiveService = inject(AdaptiveRecommendationsService);
  private readonly behaviorTracker = inject(BehaviorTrackerService);

  protected readonly routineId = signal<string>('');
  protected readonly instance = signal<RoutineInstance | null>(null);
  protected readonly confirmDelete = signal(false);
  protected readonly suggestionBusy = signal<string | null>(null);

  protected readonly routine = computed(() =>
    this.routineService.routinesWithStats().find(r => r.id === this.routineId()),
  );

  protected readonly suggestions = computed<AdaptiveSuggestion[]>(() =>
    this.adaptiveService.suggestionsForRoutine(this.routineId()),
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

  protected readonly tasksDoneCount = computed(() => {
    const r = this.routine();
    if (!r) return 0;
    return r.tasks.filter(t => this.taskCompleted(t.id)).length;
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.routineId.set(id);
    this.routineService.loadAll();
    this.instanceService.loadAll();
    this.adaptiveService.loadOpen();
    await new Promise(r => setTimeout(r, 250));
    if (id) {
      const instance = await firstValueFrom(
        this.instanceService.getOrCreateForDate(id, new Date()),
      );
      this.instance.set(instance);
      this.behaviorTracker.track(BehaviorEventType.ROUTINE_OPENED, { routineId: id });
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
    this.behaviorTracker.track(
      result.completed ? BehaviorEventType.TASK_CHECKED : BehaviorEventType.TASK_UNCHECKED,
      { routineId: this.routineId(), taskId },
    );
    if (result.instance.status === RoutineInstanceStatus.COMPLETED) {
      this.behaviorTracker.track(BehaviorEventType.ROUTINE_COMPLETED, { routineId: this.routineId() });
      this.adaptiveService.runAll().subscribe();
    }
  }

  async onSkip(): Promise<void> {
    const inst = this.instance();
    if (!inst) return;
    const skipped = await firstValueFrom(this.instanceService.skip(inst.id));
    this.instance.set(skipped);
    this.behaviorTracker.track(BehaviorEventType.ROUTINE_SKIPPED, { routineId: this.routineId() });
  }

  async onDelete(): Promise<void> {
    const id = this.routineId();
    if (!id) return;
    this.confirmDelete.set(false);
    await firstValueFrom(this.routineService.delete(id));
    this.router.navigate(['/routines']);
  }

  onAcceptSuggestion(suggestion: AdaptiveSuggestion): void {
    this.suggestionBusy.set(suggestion.id);
    this.adaptiveService.acceptSuggestion(suggestion).subscribe({
      next: () => {
        this.suggestionBusy.set(null);
        this.behaviorTracker.track(BehaviorEventType.SUGGESTION_ACCEPTED, {
          routineId: this.routineId(),
          suggestionId: suggestion.id,
          type: suggestion.type,
        });
      },
      error: () => this.suggestionBusy.set(null),
    });
  }

  onDismissSuggestion(id: string): void {
    this.suggestionBusy.set(id);
    this.adaptiveService.dismissSuggestion(id).subscribe({
      next: () => {
        this.suggestionBusy.set(null);
        this.behaviorTracker.track(BehaviorEventType.SUGGESTION_DISMISSED, {
          routineId: this.routineId(),
          suggestionId: id,
        });
      },
      error: () => this.suggestionBusy.set(null),
    });
  }

  protected heroGradient(r: RoutineWithStats): string {
    const c = r.color || '#6366f1';
    return `linear-gradient(135deg, ${c} 0%, ${this.shade(c, -18)} 100%)`;
  }

  private shade(hex: string, percent: number): string {
    const sanitized = hex.replace('#', '');
    if (sanitized.length !== 6) return hex;
    const num = parseInt(sanitized, 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * percent / 100)));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent / 100)));
    const b = Math.max(0, Math.min(255, (num & 0xff) + Math.round(255 * percent / 100)));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
}
