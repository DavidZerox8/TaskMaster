import { ApplicationConfig, provideExperimentalZonelessChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
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
    ...APP_REPOSITORY_PROVIDERS,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeMigration,
      deps: [MigrationService],
      multi: true,
    },
  ],
};
