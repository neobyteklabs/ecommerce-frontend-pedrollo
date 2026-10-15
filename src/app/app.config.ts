import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer, inject, DOCUMENT } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { storeKeyInterceptor } from './core/api/storefront-api';
import { routes } from './app.routes';
import { BRAND } from './core/brand';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions(), withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })),
    provideHttpClient(withFetch(), withInterceptors([storeKeyInterceptor])),
    provideClientHydration(withEventReplay()),
    provideAppInitializer(() => { inject(DOCUMENT).documentElement?.setAttribute('data-brand', inject(BRAND).id); }),
  ],
};
