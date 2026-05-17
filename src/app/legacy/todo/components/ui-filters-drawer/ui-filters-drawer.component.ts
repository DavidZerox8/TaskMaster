import { Component, ChangeDetectionStrategy, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoFiltersComponent } from '../todo-filters/todo-filters.component';
import { TodoFilters } from '../../models/todo.model';

@Component({
  selector: 'app-ui-filters-drawer',
  standalone: true,
  imports: [CommonModule, TodoFiltersComponent],
  templateUrl: './ui-filters-drawer.component.html',
  styleUrls: ['./ui-filters-drawer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiFiltersDrawerComponent {
  @Input() open = false;
  @Input() categories: string[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() filtersChange = new EventEmitter<TodoFilters>();
  @Output() clearFilters = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEsc() { if (this.open) this.close.emit(); }
}
