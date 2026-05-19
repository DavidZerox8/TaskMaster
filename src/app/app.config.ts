import { ApplicationConfig, isDevMode, provideExperimentalZonelessChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { APP_REPOSITORY_PROVIDERS } from './core/providers/app.providers';
import { MigrationService } from './core/services/migration.service';

function initializeMigration(migrationService: MigrationService) {
  return () => migrationService.migrate();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    ...APP_REPOSITORY_PROVIDERS,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeMigration,
      deps: [MigrationService],
      multi: true,
    },
  ],
};
