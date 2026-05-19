import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'lock',
    loadComponent: () =>
      import('./features/auth/pages/lock-page/lock-page.component')
        .then(m => m.LockPageComponent),
  },
  {
    path: 'onboarding',
    loadChildren: () =>
      import('./features/onboarding/onboarding.routes')
        .then(m => m.ONBOARDING_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page/dashboard-page.component')
        .then(m => m.DashboardPageComponent),
  },
  {
    path: 'habits',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/habits/habits.routes')
        .then(m => m.HABIT_ROUTES),
  },
  {
    path: 'routines',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/routines/routines.routes')
        .then(m => m.ROUTINE_ROUTES),
  },
  {
    path: 'achievements',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/achievements/pages/achievements-page/achievements-page.component')
        .then(m => m.AchievementsPageComponent),
  },
  {
    path: 'rewards',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/rewards/pages/rewards-page/rewards-page.component')
        .then(m => m.RewardsPageComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/pages/profile-page/profile-page.component')
        .then(m => m.ProfilePageComponent),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
