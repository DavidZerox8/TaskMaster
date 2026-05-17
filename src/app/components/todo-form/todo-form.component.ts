import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TodoService } from '../../core/services/todo.service';
import { TodoCreateRequest, Priority } from '../../models/todo.model';

@Component({
  selector: 'app-todo-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todo-form.component.html',
  styleUrls: ['./todo-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoFormComponent implements OnInit, OnDestroy {
  todoForm: TodoCreateRequest = {
    title: '',
    description: '',
    priority: Priority.MEDIUM,
    category: '',
    dueDate: undefined
  };

  showForm = false;
  categories: string[] = [];
  loading = false;

  priorities = [
    { value: Priority.LOW, label: 'Baja', color: 'text-green-600 bg-green-100' },
    { value: Priority.MEDIUM, label: 'Media', color: 'text-yellow-600 bg-yellow-100' },
    { value: Priority.HIGH, label: 'Alta', color: 'text-orange-600 bg-orange-100' },
    { value: Priority.URGENT, label: 'Urgente', color: 'text-red-600 bg-red-100' }
  ];

  private destroy$ = new Subject<void>();

  constructor(private todoService: TodoService) {}

  ngOnInit(): void {
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

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  onSubmit(): void {
    if (!this.todoForm.title.trim()) {
      return;
    }

    this.loading = true;
    this.todoService.createTodo(this.todoForm).subscribe({
      next: () => {
        this.resetForm();
        this.showForm = false;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.todoForm = {
      title: '',
      description: '',
      priority: Priority.MEDIUM,
      category: '',
      dueDate: undefined
    };
  }

  getPriorityColor(priority: Priority): string {
    const priorityObj = this.priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'text-gray-600 bg-gray-100';
  }

  getPriorityLabel(priority: Priority): string {
    const priorityObj = this.priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.label : 'Sin prioridad';
  }
}
