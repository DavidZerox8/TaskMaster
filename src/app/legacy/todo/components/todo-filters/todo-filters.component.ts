import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TodoFilters, Priority } from '../../models/todo.model';

@Component({
  selector: 'app-todo-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todo-filters.component.html',
  styleUrls: ['./todo-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoFiltersComponent {
  @Input() categories: string[] = [];
  @Output() filtersChange = new EventEmitter<TodoFilters>();
  @Output() clearFilters = new EventEmitter<void>();

  searchTerm = '';
  selectedPriority: Priority | '' = '';
  selectedCategory = '';
  showCompleted: boolean | null = null;

  priorities = [
    { value: '', label: 'Todas las prioridades' },
    { value: Priority.LOW, label: 'Baja' },
    { value: Priority.MEDIUM, label: 'Media' },
    { value: Priority.HIGH, label: 'Alta' },
    { value: Priority.URGENT, label: 'Urgente' }
  ];

  statusOptions = [
    { value: null, label: 'Todas las tareas' },
    { value: false, label: 'Solo pendientes' },
    { value: true, label: 'Solo completadas' }
  ];

  onFiltersChange(): void {
    const filters: TodoFilters = {};

    if (this.searchTerm.trim()) {
      filters.searchTerm = this.searchTerm.trim();
    }

    if (this.selectedPriority) {
      filters.priority = this.selectedPriority as Priority;
    }

    if (this.selectedCategory) {
      filters.category = this.selectedCategory;
    }

    if (this.showCompleted !== null) {
      filters.completed = this.showCompleted;
    }

    this.filtersChange.emit(filters);
  }

  onClearFilters(): void {
    this.searchTerm = '';
    this.selectedPriority = '';
    this.selectedCategory = '';
    this.showCompleted = null;
    this.clearFilters.emit();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedPriority || this.selectedCategory || this.showCompleted !== null);
  }

  clearSearchTerm(): void {
    this.searchTerm = '';
    this.onFiltersChange();
  }

  clearPriority(): void {
    this.selectedPriority = '';
    this.onFiltersChange();
  }

  clearCategory(): void {
    this.selectedCategory = '';
    this.onFiltersChange();
  }

  clearStatus(): void {
    this.showCompleted = null;
    this.onFiltersChange();
  }

  getPriorityLabel(value: Priority | ''): string {
    const priority = this.priorities.find(p => p.value === value);
    return priority ? priority.label : '';
  }

  getStatusLabel(value: boolean | null): string {
    const status = this.statusOptions.find(s => s.value === value);
    return status ? status.label : '';
  }
}
