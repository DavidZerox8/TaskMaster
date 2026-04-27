import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { Task } from '../../../../models/routine.model';

@Component({
  selector: 'app-task-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors"
           [class.opacity-60]="completed()">
      <input type="checkbox"
             class="w-5 h-5 accent-indigo-600 cursor-pointer"
             [checked]="completed()"
             (change)="toggle.emit(task().id)" />
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
    </label>
  `,
})
export class TaskRowComponent {
  readonly task = input.required<Task>();
  readonly completed = input<boolean>(false);
  readonly showHandle = input<boolean>(false);
  readonly toggle = output<string>();
}
