import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page/dashboard-page.component')
        .then(m => m.DashboardPageComponent),
  },
  {
    path: 'habits',
    loadChildren: () =>
      import('./features/habits/habits.routes')
        .then(m => m.HABIT_ROUTES),
  },
  {
    path: 'routines',
    loadChildren: () =>
      import('./features/routines/routines.routes')
        .then(m => m.ROUTINE_ROUTES),
  },
  {
    path: 'achievements',
    loadComponent: () =>
      import('./features/achievements/pages/achievements-page/achievements-page.component')
        .then(m => m.AchievementsPageComponent),
  },
  {
    path: 'rewards',
    loadComponent: () =>
      import('./features/rewards/pages/rewards-page/rewards-page.component')
        .then(m => m.RewardsPageComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/pages/profile-page/profile-page.component')
        .then(m => m.ProfilePageComponent),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
