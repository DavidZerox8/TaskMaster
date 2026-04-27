import { Component, ChangeDetectionStrategy, OnInit, inject, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RoutineService } from '../../../../core/services/routine.service';
import { RoutineCardComponent } from '../../components/routine-card/routine-card.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-routines-index-page',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RoutineCardComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in pb-24">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Mis rutinas</h1>
          <p class="text-sm text-gray-500 mt-1">{{ activeCount() }} activas · {{ todayCount() }} hoy</p>
        </div>
        <a routerLink="/routines/new" class="btn-primary">+ Nueva</a>
      </header>

      <nav class="flex gap-2 text-sm">
        <a routerLink="/routines" routerLinkActive="bg-indigo-600 text-white" [routerLinkActiveOptions]="{ exact: true }"
           class="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">Todas</a>
        <a routerLink="/routines/today" routerLinkActive="bg-indigo-600 text-white"
           class="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">Hoy</a>
      </nav>

      @if (routines().length === 0) {
        <app-empty-state
          icon="📋"
          title="Sin rutinas todavía"
          message="Crea tu primera rutina para empezar a organizar tu día."
          actionLabel="Crear rutina"
          (actionClicked)="goNew()" />
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (r of routines(); track r.id) {
            <app-routine-card [routine]="r" (edit)="goEdit($event)" />
          }
        </div>
      }
    </div>
  `,
})
export class RoutinesIndexPageComponent implements OnInit {
  private readonly routineService = inject(RoutineService);
  private readonly router = inject(Router);

  protected readonly routines = this.routineService.routinesWithStats;
  protected readonly activeCount = computed(() => this.routineService.activeRoutines().length);
  protected readonly todayCount = computed(() => this.routineService.todayRoutines().length);

  ngOnInit(): void {
    this.routineService.loadAll();
  }

  goNew(): void {
    this.router.navigate(['/routines/new']);
  }

  goEdit(id: string): void {
    this.router.navigate(['/routines', id, 'edit']);
  }
}
