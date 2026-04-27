import { Routes } from '@angular/router';

export const ROUTINE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/routines-index-page/routines-index-page.component').then(
        m => m.RoutinesIndexPageComponent,
      ),
  },
  {
    path: 'today',
    loadComponent: () =>
      import('./pages/routines-today-page/routines-today-page.component').then(
        m => m.RoutinesTodayPageComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/routine-form-page/routine-form-page.component').then(
        m => m.RoutineFormPageComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/routine-form-page/routine-form-page.component').then(
        m => m.RoutineFormPageComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/routine-detail-page/routine-detail-page.component').then(
        m => m.RoutineDetailPageComponent,
      ),
  },
];
