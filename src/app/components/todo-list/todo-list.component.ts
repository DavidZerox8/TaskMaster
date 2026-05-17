import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TodoService } from '../../core/services/todo.service';
import { Todo, Priority, TodoFilters } from '../../models/todo.model';
import { TodoItemComponent } from '../todo-item/todo-item.component';
import { TodoFormComponent } from '../todo-form/todo-form.component';
import { UiToolbarComponent } from '../ui-toolbar/ui-toolbar.component';
import { UiFiltersDrawerComponent } from '../ui-filters-drawer/ui-filters-drawer.component';
import { TodoStatsCompactComponent } from '../todo-stats-compact/todo-stats-compact.component';
import { UiPreferencesService } from '../../core/services/ui-preferences.service';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TodoItemComponent,
    TodoFormComponent,
    UiToolbarComponent,
    UiFiltersDrawerComponent,
    TodoStatsCompactComponent
  ],
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoListComponent implements OnInit, OnDestroy {
  todos: Todo[] = [];
  loading = false;
  showCompleted = true;
  searchTerm = '';
  selectedPriority: Priority | '' = '';
  selectedCategory = '';
  categories: string[] = [];

  filtersOpen = false;

  private destroy$ = new Subject<void>();

  constructor(private todoService: TodoService, public ui: UiPreferencesService) {}

  ngOnInit(): void {
    this.todoService.filteredTodos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(todos => {
        this.todos = todos;
      });

    this.todoService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });

    this.todoService.categories$
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToggleComplete(todo: Todo): void {
    this.todoService.toggleComplete(todo.id).subscribe();
  }

  onDeleteTodo(todo: Todo): void {
    this.todoService.deleteTodo(todo.id).subscribe();
  }

  onUpdateTodo(todo: Todo): void {
    // Esta funcionalidad se implementarÃ¡ en el componente TodoItem
  }

  onFiltersChange(filters: TodoFilters): void {
    this.todoService.setFilters(filters);
  }

  onClearFilters(): void {
    this.todoService.clearFilters();
  }

  getPriorityColor(priority: Priority): string {
    switch (priority) {
      case Priority.LOW: return 'text-green-600 bg-green-100';
      case Priority.MEDIUM: return 'text-yellow-600 bg-yellow-100';
      case Priority.HIGH: return 'text-orange-600 bg-orange-100';
      case Priority.URGENT: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getPriorityLabel(priority: Priority): string {
    switch (priority) {
      case Priority.LOW: return 'Baja';
      case Priority.MEDIUM: return 'Media';
      case Priority.HIGH: return 'Alta';
      case Priority.URGENT: return 'Urgente';
      default: return 'Sin prioridad';
    }
  }

  getCompletedTodos(): Todo[] {
    return this.todos.filter(t => t.completed);
  }
}
