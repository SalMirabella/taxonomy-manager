import { ApplicationConfig, LOCALE_ID, APP_INITIALIZER } from '@angular/core';
import { EcmoDataService } from './services/ecmo-data.service';

/**
 * Factory function to initialize ECMO data before app starts
 */
export function initializeApp(ecmoDataService: EcmoDataService) {
  return () => ecmoDataService.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'en-US' },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [EcmoDataService],
      multi: true
    }
  ]
};