import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-toolbar.component.html',
  styleUrls: ['./ui-toolbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiToolbarComponent {
  @Input() title = 'TaskMaster';

  @Output() openFilters = new EventEmitter<void>();
  @Output() newTask = new EventEmitter<void>();
}
