import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Todo, Priority } from '../../models/todo.model';

@Component({
  selector: 'app-todo-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './todo-item.component.html',
  styleUrls: ['./todo-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoItemComponent {
  @Input() todo!: Todo;
  @Output() toggleComplete = new EventEmitter<Todo>();
  @Output() delete = new EventEmitter<Todo>();
  @Output() update = new EventEmitter<Todo>();

  showDetails = false;

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

  getPriorityIcon(priority: Priority): string {
    switch (priority) {
      case Priority.LOW: return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case Priority.MEDIUM: return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case Priority.HIGH: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case Priority.URGENT: return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      default: return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  onToggleComplete(): void {
    this.toggleComplete.emit(this.todo);
  }

  onDelete(): void {
    if (confirm('Â¿EstÃ¡s seguro de que quieres eliminar esta tarea?')) {
      this.delete.emit(this.todo);
    }
  }

  onUpdate(): void {
    this.update.emit(this.todo);
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isOverdue(): boolean {
    if (!this.todo.dueDate || this.todo.completed) return false;
    return new Date(this.todo.dueDate) < new Date();
  }

  getDaysUntilDue(): number {
    if (!this.todo.dueDate) return 0;
    const dueDate = new Date(this.todo.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
