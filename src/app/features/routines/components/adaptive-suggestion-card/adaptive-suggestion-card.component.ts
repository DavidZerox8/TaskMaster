import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import {
  AdaptiveSuggestion,
  AdaptiveSuggestionType,
} from '../../../../models/adaptive.model';

@Component({
  selector: 'app-adaptive-suggestion-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md animate-slide-up"
      [class]="palette().card">
      <div class="absolute inset-y-0 left-0 w-1" [class]="palette().accent"></div>
      <div class="flex items-start gap-3 pl-2">
        <span class="text-2xl leading-none" aria-hidden="true">{{ icon() }}</span>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wider" [class]="palette().label">{{ kindLabel() }}</p>
          <h3 class="font-semibold text-gray-900 text-sm mt-0.5">{{ title() }}</h3>
          @if (subtitle()) {
            <p class="text-xs text-gray-600 mt-1">{{ subtitle() }}</p>
          }
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              (click)="accept.emit(suggestion())"
              [disabled]="busy()"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              [class]="palette().primary">
              {{ acceptLabel() }}
            </button>
            <button
              type="button"
              (click)="dismiss.emit(suggestion().id)"
              [disabled]="busy()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50">
              Descartar
            </button>
          </div>
        </div>
      </div>
    </article>
  `,
  styles: [`
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up { animation: slide-up 280ms ease both; }
  `],
})
export class AdaptiveSuggestionCardComponent {
  readonly suggestion = input.required<AdaptiveSuggestion>();
  readonly busy = input(false);
  readonly accept = output<AdaptiveSuggestion>();
  readonly dismiss = output<string>();

  protected readonly icon = computed(() => {
    switch (this.suggestion().type) {
      case AdaptiveSuggestionType.TIME_WINDOW_ADJUST: return '🕒';
      case AdaptiveSuggestionType.STREAK_CELEBRATION: return '🎉';
      case AdaptiveSuggestionType.MISSED_ROUTINE: return '🌱';
      case AdaptiveSuggestionType.TASK_REORDER: return '🔀';
      default: return '✨';
    }
  });

  protected readonly kindLabel = computed(() => {
    switch (this.suggestion().type) {
      case AdaptiveSuggestionType.TIME_WINDOW_ADJUST: return 'Ajuste de horario';
      case AdaptiveSuggestionType.STREAK_CELEBRATION: return 'Celebracion';
      case AdaptiveSuggestionType.MISSED_ROUTINE: return 'Reactivacion';
      case AdaptiveSuggestionType.TASK_REORDER: return 'Reorden';
      default: return 'Sugerencia';
    }
  });

  protected readonly title = computed(() => {
    const s = this.suggestion();
    if (s.payload.type === 'time_window_adjust') {
      return s.payload.currentStart
        ? `Mover horario a ${s.payload.proposedStart}`
        : `Fijar horario en ${s.payload.proposedStart}`;
    }
    if (s.payload.type === 'streak_celebration') {
      return `${s.payload.currentStreak} dias seguidos · ¡celebra!`;
    }
    if (s.payload.type === 'missed_routine') {
      return `${s.payload.daysMissed} dias sin completar`;
    }
    if (s.payload.type === 'task_reorder') {
      return 'Reordenar las tareas';
    }
    return 'Sugerencia';
  });

  protected readonly subtitle = computed(() => {
    const s = this.suggestion();
    if (s.payload.type === 'time_window_adjust') return s.payload.reason;
    if (s.payload.type === 'streak_celebration') return s.payload.message ?? '';
    if (s.payload.type === 'missed_routine') return s.payload.encouragement ?? '';
    if (s.payload.type === 'task_reorder') return s.payload.reason;
    return '';
  });

  protected readonly acceptLabel = computed(() => {
    switch (this.suggestion().type) {
      case AdaptiveSuggestionType.TIME_WINDOW_ADJUST: return 'Aplicar';
      case AdaptiveSuggestionType.STREAK_CELEBRATION: return 'Celebrar';
      case AdaptiveSuggestionType.MISSED_ROUTINE: return 'Retomar';
      case AdaptiveSuggestionType.TASK_REORDER: return 'Reordenar';
      default: return 'Aceptar';
    }
  });

  protected readonly palette = computed(() => {
    switch (this.suggestion().type) {
      case AdaptiveSuggestionType.STREAK_CELEBRATION:
        return {
          card: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
          accent: 'bg-amber-400',
          label: 'text-amber-700',
          primary: 'bg-amber-500 text-white hover:bg-amber-600',
        };
      case AdaptiveSuggestionType.MISSED_ROUTINE:
        return {
          card: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200',
          accent: 'bg-emerald-400',
          label: 'text-emerald-700',
          primary: 'bg-emerald-500 text-white hover:bg-emerald-600',
        };
      case AdaptiveSuggestionType.TIME_WINDOW_ADJUST:
        return {
          card: 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200',
          accent: 'bg-indigo-400',
          label: 'text-indigo-700',
          primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
        };
      default:
        return {
          card: 'bg-white border-gray-200',
          accent: 'bg-gray-400',
          label: 'text-gray-700',
          primary: 'bg-gray-700 text-white hover:bg-gray-800',
        };
    }
  });
}
