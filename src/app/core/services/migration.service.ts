import { Injectable } from '@angular/core';
import { Habit, HabitCategory, HabitType, HabitFrequency } from '../../models/habit.model';

@Injectable({ providedIn: 'root' })
export class MigrationService {
  private readonly MIGRATION_KEY = 'taskmaster_migration_version';
  private readonly CURRENT_VERSION = 2;
  private readonly ROUTINE_KEYS_V2 = [
    'routines',
    'routine_tasks',
    'routine_instances',
    'task_completions',
    'routine_streaks',
    'behavior_events',
    'reminder_preferences',
    'scheduled_reminders',
  ];

  migrate(): void {
    const raw = localStorage.getItem(this.MIGRATION_KEY);
    const version = raw ? parseInt(raw, 10) : 0;
    if (version < 1) {
      this.migrateTodosToHabits();
    }
    if (version < 2) {
      this.initRoutineKeysV2();
    }
    if (version < this.CURRENT_VERSION) {
      localStorage.setItem(this.MIGRATION_KEY, String(this.CURRENT_VERSION));
    }
  }

  private initRoutineKeysV2(): void {
    for (const key of this.ROUTINE_KEYS_V2) {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, '[]');
      }
    }
  }

  private migrateTodosToHabits(): void {
    const todosRaw = localStorage.getItem('todos');
    if (!todosRaw) return;

    try {
      const todos = JSON.parse(todosRaw);
      if (!Array.isArray(todos) || todos.length === 0) return;

      // Only migrate if habits don't exist yet
      const existingHabits = localStorage.getItem('habits');
      if (existingHabits) {
        const parsed = JSON.parse(existingHabits);
        if (Array.isArray(parsed) && parsed.length > 0) return;
      }

      const habits: Habit[] = todos.map((todo: any) => this.todoToHabit(todo));
      localStorage.setItem('habits', JSON.stringify(habits));
    } catch {
      console.warn('MigrationService: Failed to migrate todos to habits');
    }
  }

  private todoToHabit(todo: any): Habit {
    return {
      id: todo.id,
      userId: 'local-user',
      title: todo.title,
      description: todo.description ?? '',
      category: this.mapCategory(todo.category),
      type: HabitType.BUILD,
      frequency: HabitFrequency.DAILY,
      isArchived: todo.completed ?? false,
      icon: this.getCategoryIcon(this.mapCategory(todo.category)),
      color: '#6366f1',
      createdAt: todo.createdAt ? new Date(todo.createdAt) : new Date(),
      updatedAt: todo.updatedAt ? new Date(todo.updatedAt) : new Date(),
    };
  }

  private mapCategory(category?: string): HabitCategory {
    if (!category) return HabitCategory.CUSTOM;
    const lower = category.toLowerCase();
    if (lower.includes('salud') || lower.includes('health')) return HabitCategory.HEALTH;
    if (lower.includes('trabajo') || lower.includes('product')) return HabitCategory.PRODUCTIVITY;
    if (lower.includes('ejercicio') || lower.includes('fitness') || lower.includes('deporte')) return HabitCategory.FITNESS;
    if (lower.includes('estudio') || lower.includes('learn') || lower.includes('aprend')) return HabitCategory.LEARNING;
    if (lower.includes('social') || lower.includes('amigo') || lower.includes('familia')) return HabitCategory.SOCIAL;
    if (lower.includes('dinero') || lower.includes('financ') || lower.includes('ahorro')) return HabitCategory.FINANCE;
    if (lower.includes('medita') || lower.includes('mindful') || lower.includes('relax')) return HabitCategory.MINDFULNESS;
    return HabitCategory.CUSTOM;
  }

  private getCategoryIcon(category: HabitCategory): string {
    const icons: Record<HabitCategory, string> = {
      [HabitCategory.HEALTH]: '❤️',
      [HabitCategory.PRODUCTIVITY]: '⚡',
      [HabitCategory.MINDFULNESS]: '🧘',
      [HabitCategory.FITNESS]: '💪',
      [HabitCategory.LEARNING]: '📚',
      [HabitCategory.SOCIAL]: '👥',
      [HabitCategory.FINANCE]: '💰',
      [HabitCategory.CUSTOM]: '🎯',
    };
    return icons[category];
  }
}
