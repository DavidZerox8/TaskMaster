import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { GamificationService } from '../../../../core/services/gamification.service';
import { UserService } from '../../../../core/services/user.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
      <!-- Logo -->
      <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <span class="text-2xl">🎯</span>
        <div>
          <h1 class="text-lg font-bold text-gray-900">TaskMaster</h1>
          <p class="text-xs text-gray-500">Habitos & IA</p>
        </div>
      </div>

      <!-- User info -->
      <div class="px-4 py-4 border-b border-gray-100">
        <div class="flex items-center gap-3 px-2">
          <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
            {{ userService.displayName().charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ userService.displayName() }}</p>
            <p class="text-xs text-indigo-600 font-medium">
              Nv. {{ gamificationService.userLevel().level }} - {{ gamificationService.userLevel().title }}
            </p>
          </div>
        </div>
        <!-- XP Bar mini -->
        <div class="mt-3 mx-2">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>{{ gamificationService.userLevel().currentXP }} XP</span>
            <span>{{ gamificationService.userLevel().xpForNextLevel }} XP</span>
          </div>
          <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-indigo-500 rounded-full transition-all duration-500"
              [style.width.%]="xpProgress()">
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        @for (item of navItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-indigo-50 text-indigo-700"
            [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <span class="text-lg">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- Points -->
      <div class="px-4 py-4 border-t border-gray-100">
        <div class="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg">
          <span class="text-lg">🪙</span>
          <div>
            <p class="text-xs text-amber-700 font-medium">Puntos disponibles</p>
            <p class="text-sm font-bold text-amber-800">{{ gamificationService.availablePoints() }}</p>
          </div>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  userService = inject(UserService);
  gamificationService = inject(GamificationService);

  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/routines', label: 'Rutinas', icon: '📋' },
    { path: '/habits', label: 'Mis Habitos', icon: '🔄' },
    { path: '/achievements', label: 'Logros', icon: '🏆' },
    { path: '/rewards', label: 'Premios', icon: '🎁' },
    { path: '/profile', label: 'Perfil', icon: '👤' },
  ];

  xpProgress() {
    const level = this.gamificationService.userLevel();
    if (level.xpForNextLevel === 0) return 100;
    return Math.round((level.currentXP / level.xpForNextLevel) * 100);
  }
}
