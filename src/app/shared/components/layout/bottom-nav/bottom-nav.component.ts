import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
      <div class="flex items-center justify-around px-2 py-1">
        @for (item of navItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="text-indigo-600"
            [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
            class="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-600 transition-colors min-w-0">
            <span class="text-xl">{{ item.icon }}</span>
            <span class="text-[10px] font-medium truncate">{{ item.label }}</span>
          </a>
        }
      </div>
    </nav>
  `,
  styles: [`
    .safe-area-bottom {
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
  `],
})
export class BottomNavComponent {
  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Inicio', icon: '📊' },
    { path: '/routines', label: 'Rutinas', icon: '📋' },
    { path: '/habits', label: 'Habitos', icon: '🔄' },
    { path: '/achievements', label: 'Logros', icon: '🏆' },
    { path: '/profile', label: 'Perfil', icon: '👤' },
  ];
}
