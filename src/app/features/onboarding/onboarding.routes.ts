import { Routes } from '@angular/router';

export const ONBOARDING_ROUTES: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  {
    path: 'welcome',
    loadComponent: () =>
      import('./pages/welcome-page/welcome-page.component').then(m => m.WelcomePageComponent),
  },
  {
    path: 'goals',
    loadComponent: () =>
      import('./pages/goals-page/goals-page.component').then(m => m.GoalsPageComponent),
  },
  {
    path: 'templates',
    loadComponent: () =>
      import('./pages/templates-page/templates-page.component').then(m => m.TemplatesPageComponent),
  },
  {
    path: 'ai',
    loadComponent: () =>
      import('./pages/ai-page/ai-page.component').then(m => m.AiPageComponent),
  },
  {
    path: 'pin',
    loadComponent: () =>
      import('./pages/pin-page/pin-page.component').then(m => m.PinPageComponent),
  },
  {
    path: 'done',
    loadComponent: () =>
      import('./pages/done-page/done-page.component').then(m => m.DonePageComponent),
  },
];
