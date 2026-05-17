import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { TodoService } from '../../core/services/todo.service';

interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  urgent: number;
  completionRate: number;
}

@Component({
  selector: 'app-todo-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './todo-stats.component.html',
  styleUrls: ['./todo-stats.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoStatsComponent implements OnInit, OnDestroy {
  stats: TodoStats = {
    total: 0,
    completed: 0,
    pending: 0,
    urgent: 0,
    completionRate: 0
  };

  private destroy$ = new Subject<void>();

  constructor(private todoService: TodoService) {}

  ngOnInit(): void {
    this.todoService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.stats = stats;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getProgressColor(): string {
    if (this.stats.completionRate >= 80) return 'bg-green-500';
    if (this.stats.completionRate >= 60) return 'bg-yellow-500';
    if (this.stats.completionRate >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }
}
