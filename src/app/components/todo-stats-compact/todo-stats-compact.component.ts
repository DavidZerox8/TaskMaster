import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService } from '../../core/services/todo.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-todo-stats-compact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './todo-stats-compact.component.html',
  styleUrls: ['./todo-stats-compact.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoStatsCompactComponent implements OnInit {
  stats$!: Observable<{ total: number; completed: number; pending: number; urgent: number; rate: number }>;

  constructor(private todoService: TodoService) {}

  ngOnInit(): void {
    this.stats$ = this.todoService.getStats().pipe(
      map(s => ({
        total: s.total,
        completed: s.completed,
        pending: s.pending,
        urgent: s.urgent,
        rate: Math.round(s.completionRate)
      }))
    );
  }
}
