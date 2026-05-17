import { Injectable, Inject, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { ITodoRepository, TODO_REPOSITORY_TOKEN } from '../interfaces/todo-repository.interface';
import { Todo, TodoCreateRequest, TodoUpdateRequest, TodoFilters, Priority } from '../../models/todo.model';

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private readonly todosSignal = signal<Todo[]>([]);
  private readonly filtersSignal = signal<TodoFilters>({});
  private readonly loadingSignal = signal<boolean>(false);

  readonly todos = this.todosSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  readonly filteredTodos = computed(() => this.applyFilters(this.todosSignal(), this.filtersSignal()));
  readonly completedTodos = computed(() => this.todosSignal().filter((t) => t.completed));
  readonly pendingTodos = computed(() => this.todosSignal().filter((t) => !t.completed));
  readonly urgentTodos = computed(() =>
    this.todosSignal().filter((t) => t.priority === Priority.URGENT && !t.completed),
  );
  readonly categories = computed(() => {
    const seen = new Set<string>();
    for (const todo of this.todosSignal()) {
      if (todo.category) seen.add(todo.category);
    }
    return [...seen];
  });
  readonly stats = computed(() => {
    const todos = this.todosSignal();
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const pending = total - completed;
    const urgent = todos.filter((t) => t.priority === Priority.URGENT && !t.completed).length;
    return {
      total,
      completed,
      pending,
      urgent,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  });

  /** Backward-compatible Observable façades for legacy consumers. */
  readonly todos$ = toObservable(this.todosSignal);
  readonly filters$ = toObservable(this.filtersSignal);
  readonly loading$ = toObservable(this.loadingSignal);
  readonly filteredTodos$ = toObservable(this.filteredTodos);
  readonly completedTodos$ = toObservable(this.completedTodos);
  readonly pendingTodos$ = toObservable(this.pendingTodos);
  readonly urgentTodos$ = toObservable(this.urgentTodos);
  readonly categories$ = toObservable(this.categories);

  constructor(@Inject(TODO_REPOSITORY_TOKEN) private todoRepository: ITodoRepository) {
    this.loadTodos();
  }

  loadTodos(): void {
    this.loadingSignal.set(true);
    this.todoRepository
      .getAll()
      .pipe(
        tap((todos) => {
          this.todosSignal.set(todos);
          this.loadingSignal.set(false);
        }),
      )
      .subscribe();
  }

  createTodo(todoRequest: TodoCreateRequest): Observable<Todo> {
    this.loadingSignal.set(true);
    return this.todoRepository.create(todoRequest).pipe(
      tap((newTodo) => {
        this.todosSignal.update((current) => [...current, newTodo]);
        this.loadingSignal.set(false);
      }),
    );
  }

  updateTodo(id: string, updateRequest: TodoUpdateRequest): Observable<Todo> {
    this.loadingSignal.set(true);
    return this.todoRepository.update(id, updateRequest).pipe(
      tap((updatedTodo) => {
        this.todosSignal.update((current) => current.map((t) => (t.id === id ? updatedTodo : t)));
        this.loadingSignal.set(false);
      }),
    );
  }

  deleteTodo(id: string): Observable<boolean> {
    this.loadingSignal.set(true);
    return this.todoRepository.delete(id).pipe(
      tap(() => {
        this.todosSignal.update((current) => current.filter((t) => t.id !== id));
        this.loadingSignal.set(false);
      }),
    );
  }

  toggleComplete(id: string): Observable<Todo> {
    this.loadingSignal.set(true);
    return this.todoRepository.toggleComplete(id).pipe(
      tap((updatedTodo) => {
        this.todosSignal.update((current) => current.map((t) => (t.id === id ? updatedTodo : t)));
        this.loadingSignal.set(false);
      }),
    );
  }

  setFilters(filters: TodoFilters): void {
    this.filtersSignal.set(filters);
  }

  clearFilters(): void {
    this.filtersSignal.set({});
  }

  getTodoById(id: string): Observable<Todo | null> {
    return this.todoRepository.getById(id);
  }

  getCategories(): Observable<string[]> {
    return this.todoRepository.getCategories();
  }

  private applyFilters(todos: Todo[], filters: TodoFilters): Todo[] {
    return todos.filter((todo) => {
      if (filters.completed !== undefined && todo.completed !== filters.completed) return false;
      if (filters.priority && todo.priority !== filters.priority) return false;
      if (filters.category && todo.category !== filters.category) return false;
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesTitle = todo.title.toLowerCase().includes(searchLower);
        const matchesDescription = todo.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) return false;
      }
      return true;
    });
  }
}

