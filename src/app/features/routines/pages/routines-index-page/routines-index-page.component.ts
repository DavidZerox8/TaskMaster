import { Component, ChangeDetectionStrategy, OnInit, inject, computed, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RoutineService } from '../../../../core/services/routine.service';
import { AdaptiveRecommendationsService } from '../../../../core/services/adaptive-recommendations.service';
import { RoutineCardComponent } from '../../components/routine-card/routine-card.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-routines-index-page',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RoutineCardComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in pb-24">
      <header class="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 px-5 py-6 text-white shadow-lg">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-wider text-white/70">Centro de control</p>
            <h1 class="text-2xl font-bold mt-1">Mis rutinas</h1>
            <p class="text-sm text-white/85 mt-1">{{ activeCount() }} activas · {{ todayCount() }} programadas hoy</p>
          </div>
          <a routerLink="/routines/new"
             class="px-4 py-2 rounded-full bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors shadow">
            + Nueva
          </a>
        </div>

        @if (proposedCount() > 0) {
          <div class="mt-4 rounded-xl bg-white/15 border border-white/30 p-3 flex items-center gap-3">
            <span class="text-xl" aria-hidden="true">💡</span>
            <p class="text-sm flex-1">
              <span class="font-semibold">{{ proposedCount() }}</span> sugerencia<span>{{ proposedCount() === 1 ? '' : 's' }}</span> del coach
            </p>
          </div>
        }
      </header>

      <nav class="flex gap-2 text-sm" role="tablist">
        <a routerLink="/routines" routerLinkActive="bg-indigo-600 text-white shadow"
           [routerLinkActiveOptions]="{ exact: true }"
           class="px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
          Todas
        </a>
        <a routerLink="/routines/today" routerLinkActive="bg-indigo-600 text-white shadow"
           class="px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
          Hoy
        </a>
      </nav>

      @if (loading() && routines().length === 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (i of skeletons; track i) {
            <div class="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-200"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div class="h-3 bg-gray-100 rounded w-1/3"></div>
                </div>
              </div>
              <div class="mt-4 flex gap-2">
                <div class="h-5 w-16 rounded-full bg-gray-100"></div>
                <div class="h-5 w-12 rounded-full bg-gray-100"></div>
              </div>
            </div>
          }
        </div>
      } @else if (routines().length === 0) {
        <app-empty-state
          icon="📋"
          title="Sin rutinas todavia"
          message="Crea tu primera rutina para empezar a organizar tu dia."
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
  private readonly adaptiveService = inject(AdaptiveRecommendationsService);
  private readonly router = inject(Router);

  protected readonly skeletons = [0, 1, 2, 3];
  protected readonly routines = this.routineService.routinesWithStats;
  protected readonly loading = this.routineService.loading;
  protected readonly activeCount = computed(() => this.routineService.activeRoutines().length);
  protected readonly todayCount = computed(() => this.routineService.todayRoutines().length);
  protected readonly proposedCount = computed(() => this.adaptiveService.proposedSuggestions().length);

  ngOnInit(): void {
    this.routineService.loadAll();
    this.adaptiveService.loadOpen();
  }

  goNew(): void {
    this.router.navigate(['/routines/new']);
  }

  goEdit(id: string): void {
    this.router.navigate(['/routines', id, 'edit']);
  }
}
