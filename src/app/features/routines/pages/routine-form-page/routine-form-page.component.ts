import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { RoutineService } from '../../../../core/services/routine.service';
import {
  ScheduleType,
  ScheduleConfig,
  RoutineCreateRequest,
  isWeeklySchedule,
  isMonthlySchedule,
  isDailySchedule,
} from '../../../../models/routine.model';
import { DayOfWeek, DAY_OF_WEEK_LABELS } from '../../../../models/habit.model';

type Step = 'basics' | 'schedule' | 'tasks';

@Component({
  selector: 'app-routine-form-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-2xl mx-auto space-y-6 pb-24">
      <header class="flex items-center gap-3">
        <a routerLink="/routines" class="text-gray-400 hover:text-gray-700">←</a>
        <h1 class="text-xl font-bold text-gray-900">{{ editingId() ? 'Editar rutina' : 'Nueva rutina' }}</h1>
      </header>

      <nav class="flex border-b border-gray-200">
        @for (s of steps; track s.key) {
          <button type="button"
                  (click)="step.set(s.key)"
                  class="flex-1 py-2 text-sm font-medium transition-colors"
                  [class.text-indigo-600]="step() === s.key"
                  [class.border-b-2]="step() === s.key"
                  [class.border-indigo-600]="step() === s.key"
                  [class.text-gray-500]="step() !== s.key">
            {{ s.label }}
          </button>
        }
      </nav>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">
        @if (step() === 'basics') {
          <section class="space-y-4">
            <label class="block">
              <span class="text-sm text-gray-700">Nombre</span>
              <input formControlName="name" type="text" class="input mt-1 w-full" placeholder="Rutina matutina" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-700">Descripción</span>
              <textarea formControlName="description" rows="2" class="input mt-1 w-full" placeholder="Opcional"></textarea>
            </label>
            <div class="grid grid-cols-2 gap-4">
              <label class="block">
                <span class="text-sm text-gray-700">Icono</span>
                <input formControlName="icon" type="text" maxlength="2" class="input mt-1 w-full" placeholder="🌅" />
              </label>
              <label class="block">
                <span class="text-sm text-gray-700">Color</span>
                <input formControlName="color" type="color" class="mt-1 w-full h-10 rounded-lg border border-gray-300" />
              </label>
            </div>
          </section>
        }

        @if (step() === 'schedule') {
          <section class="space-y-4">
            <label class="block">
              <span class="text-sm text-gray-700">Frecuencia</span>
              <select formControlName="scheduleType" class="input mt-1 w-full">
                <option [value]="scheduleType.DAILY">Diario</option>
                <option [value]="scheduleType.WEEKLY">Semanal</option>
                <option [value]="scheduleType.MONTHLY">Mensual</option>
              </select>
            </label>

            @if (form.value.scheduleType === scheduleType.WEEKLY) {
              <fieldset class="space-y-2">
                <legend class="text-sm text-gray-700">Días de la semana</legend>
                <div class="flex flex-wrap gap-2">
                  @for (d of weekDays; track d.value) {
                    <label class="px-3 py-1.5 rounded-full border cursor-pointer text-sm"
                           [class.bg-indigo-600]="dayChecked(d.value)"
                           [class.text-white]="dayChecked(d.value)"
                           [class.border-indigo-600]="dayChecked(d.value)"
                           [class.text-gray-700]="!dayChecked(d.value)"
                           [class.border-gray-300]="!dayChecked(d.value)">
                      <input type="checkbox" class="hidden"
                             [checked]="dayChecked(d.value)"
                             (change)="toggleDay(d.value)" />
                      {{ d.label.slice(0, 3) }}
                    </label>
                  }
                </div>
              </fieldset>
            }

            @if (form.value.scheduleType === scheduleType.MONTHLY) {
              <label class="block">
                <span class="text-sm text-gray-700">Día del mes (1-28)</span>
                <input formControlName="dayOfMonth" type="number" min="1" max="28" class="input mt-1 w-full" />
              </label>
            }

            <div class="grid grid-cols-2 gap-4">
              <label class="block">
                <span class="text-sm text-gray-700">Inicio ventana</span>
                <input formControlName="timeWindowStart" type="time" class="input mt-1 w-full" />
              </label>
              <label class="block">
                <span class="text-sm text-gray-700">Fin ventana</span>
                <input formControlName="timeWindowEnd" type="time" class="input mt-1 w-full" />
              </label>
            </div>
          </section>
        }

        @if (step() === 'tasks') {
          <section class="space-y-3" formArrayName="tasks">
            @for (taskCtrl of taskControls(); track $index; let i = $index) {
              <div [formGroupName]="i" class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span class="text-xs text-gray-400 w-6 text-center">{{ i + 1 }}</span>
                <input formControlName="name" type="text" placeholder="Nombre tarea" class="input flex-1" />
                <input formControlName="defaultDurationMinutes" type="number" min="0" placeholder="min" class="input w-20" />
                <button type="button" (click)="removeTask(i)" class="text-red-500 hover:text-red-700 text-sm" aria-label="Eliminar">✕</button>
              </div>
            }
            <button type="button" (click)="addTask()" class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600">
              + Añadir tarea
            </button>
          </section>
        }

        <footer class="flex justify-between pt-4 border-t border-gray-200">
          <a routerLink="/routines" class="px-4 py-2 text-gray-600 hover:text-gray-900">Cancelar</a>
          <div class="flex gap-2">
            @if (step() !== 'basics') {
              <button type="button" (click)="prevStep()" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700">Atrás</button>
            }
            @if (step() !== 'tasks') {
              <button type="button" (click)="nextStep()" class="btn-primary">Siguiente</button>
            } @else {
              <button type="submit" [disabled]="form.invalid || saving()" class="btn-primary">
                {{ saving() ? 'Guardando…' : 'Guardar' }}
              </button>
            }
          </div>
        </footer>
      </form>
    </div>
  `,
})
export class RoutineFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly routineService = inject(RoutineService);

  protected readonly scheduleType = ScheduleType;
  protected readonly weekDays = Object.entries(DAY_OF_WEEK_LABELS)
    .map(([k, v]) => ({ value: Number(k) as DayOfWeek, label: v }))
    .sort((a, b) => a.value - b.value);
  protected readonly steps: { key: Step; label: string }[] = [
    { key: 'basics', label: 'Básico' },
    { key: 'schedule', label: 'Horario' },
    { key: 'tasks', label: 'Tareas' },
  ];

  protected readonly step = signal<Step>('basics');
  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    icon: ['🎯'],
    color: ['#6366f1'],
    scheduleType: [ScheduleType.DAILY],
    days: this.fb.control<DayOfWeek[]>([]),
    dayOfMonth: [1],
    timeWindowStart: [''],
    timeWindowEnd: [''],
    tasks: this.fb.array<ReturnType<typeof this.makeTask>>([]),
  });

  protected readonly taskControls = computed(() => this.taskArray().controls);

  ngOnInit(): void {
    this.routineService.loadAll();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      // wait microtask for service load
      setTimeout(() => this.hydrateFromExisting(id), 250);
    } else {
      this.addTask();
    }
  }

  private hydrateFromExisting(id: string): void {
    const routine = this.routineService.routines().find(r => r.id === id);
    if (!routine) return;
    const cfg = routine.scheduleConfig;
    this.form.patchValue({
      name: routine.name,
      description: routine.description ?? '',
      icon: routine.icon ?? '🎯',
      color: routine.color ?? '#6366f1',
      scheduleType: routine.scheduleType,
      days: isWeeklySchedule(cfg) ? cfg.days : [],
      dayOfMonth: isMonthlySchedule(cfg) ? cfg.dayOfMonth : 1,
      timeWindowStart: isDailySchedule(cfg) || isWeeklySchedule(cfg) || isMonthlySchedule(cfg) ? cfg.timeWindowStart ?? '' : '',
      timeWindowEnd: isDailySchedule(cfg) || isWeeklySchedule(cfg) || isMonthlySchedule(cfg) ? (cfg as any).timeWindowEnd ?? '' : '',
    });
    const tasks = this.routineService.getRoutineTasks(id);
    this.taskArray().clear();
    tasks.forEach(t => this.taskArray().push(this.makeTask(t.name, t.defaultDurationMinutes)));
    if (tasks.length === 0) this.addTask();
  }

  protected nextStep(): void {
    const order: Step[] = ['basics', 'schedule', 'tasks'];
    const idx = order.indexOf(this.step());
    if (idx < order.length - 1) this.step.set(order[idx + 1]);
  }

  protected prevStep(): void {
    const order: Step[] = ['basics', 'schedule', 'tasks'];
    const idx = order.indexOf(this.step());
    if (idx > 0) this.step.set(order[idx - 1]);
  }

  protected dayChecked(day: DayOfWeek): boolean {
    return (this.form.value.days ?? []).includes(day);
  }

  protected toggleDay(day: DayOfWeek): void {
    const current = this.form.value.days ?? [];
    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day].sort();
    this.form.patchValue({ days: next });
  }

  protected taskArray(): FormArray {
    return this.form.get('tasks') as FormArray;
  }

  protected addTask(): void {
    this.taskArray().push(this.makeTask());
  }

  protected removeTask(index: number): void {
    this.taskArray().removeAt(index);
  }

  private makeTask(name = '', duration: number | undefined = undefined) {
    return this.fb.group({
      name: [name, Validators.required],
      defaultDurationMinutes: [duration ?? null],
    });
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const config = this.buildConfig(v);
    const request: RoutineCreateRequest = {
      name: v.name!,
      description: v.description || undefined,
      icon: v.icon || undefined,
      color: v.color || undefined,
      scheduleType: v.scheduleType!,
      scheduleConfig: config,
      tasks: (v.tasks ?? []).map((t: any, i: number) => ({
        name: t.name,
        order: i,
        defaultDurationMinutes: t.defaultDurationMinutes ?? undefined,
      })),
    };

    try {
      const editingId = this.editingId();
      if (editingId) {
        await firstValueFrom(this.routineService.update(editingId, {
          name: request.name,
          description: request.description,
          icon: request.icon,
          color: request.color,
          scheduleType: request.scheduleType,
          scheduleConfig: request.scheduleConfig,
        }));
        this.router.navigate(['/routines', editingId]);
      } else {
        const routine = await firstValueFrom(this.routineService.create(request));
        this.router.navigate(['/routines', routine.id]);
      }
    } finally {
      this.saving.set(false);
    }
  }

  private buildConfig(v: any): ScheduleConfig {
    switch (v.scheduleType) {
      case ScheduleType.DAILY:
        return {
          type: 'daily',
          timeWindowStart: v.timeWindowStart || undefined,
          timeWindowEnd: v.timeWindowEnd || undefined,
        };
      case ScheduleType.WEEKLY:
        return {
          type: 'weekly',
          days: v.days ?? [],
          timeWindowStart: v.timeWindowStart || undefined,
          timeWindowEnd: v.timeWindowEnd || undefined,
        };
      case ScheduleType.MONTHLY:
        return {
          type: 'monthly',
          dayOfMonth: v.dayOfMonth ?? 1,
          timeWindowStart: v.timeWindowStart || undefined,
          timeWindowEnd: v.timeWindowEnd || undefined,
        };
      default:
        return { type: 'daily' };
    }
  }
}
