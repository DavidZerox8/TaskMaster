import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Gate every authenticated route. Three terminal states:
 *   - status === 'setup'     → user has no account; redirect to onboarding
 *   - status !== 'unlocked'  → session is locked; redirect to /lock
 *   - otherwise              → pass through
 *
 * `/lock` and `/onboarding/*` opt out of this guard.
 */
export const authGuard: CanActivateFn = (_route, _state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const status = auth.status();
  if (status === 'setup') return router.parseUrl('/onboarding/welcome');
  if (status !== 'unlocked') return router.parseUrl('/lock');
  return true;
};
