import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { ConvictionButtonComponent } from '../../../../shared/components/ui/conviction-button/conviction-button.component';
import { Task } from '../../../../models/routine.model';

@Component({
  selector: 'app-task-row',
  standalone: true,
  imports: [ConvictionButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg transition-colors"
         [class.opacity-60]="completed()">
      <app-conviction-button
        [completed]="completed()"
        [ariaLabel]="'Mantener pulsado para completar ' + task().name"
        (complete)="toggle.emit(task().id)" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate"
           [class.line-through]="completed()">{{ task().name }}</p>
        <div class="flex items-center gap-2 text-[11px] text-gray-500">
          @if (task().suggestedTimeOfDay) {
            <span>🕒 {{ task().suggestedTimeOfDay }}</span>
          }
          @if (task().defaultDurationMinutes) {
            <span>⏱ {{ task().defaultDurationMinutes }}m</span>
          }
        </div>
      </div>
      @if (showHandle()) {
        <span class="text-gray-300 cursor-grab" aria-hidden="true">⋮⋮</span>
      }
    </div>
  `,
})
export class TaskRowComponent {
  readonly task = input.required<Task>();
  readonly completed = input<boolean>(false);
  readonly showHandle = input<boolean>(false);
  readonly toggle = output<string>();
}
