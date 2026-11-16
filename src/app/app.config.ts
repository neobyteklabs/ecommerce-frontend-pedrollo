import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer, inject, DOCUMENT } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withComponentInputBinding } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { storeKeyInterceptor } from './core/api/storefront-api';
import { routes } from './app.routes';
import { BRAND } from './core/brand';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // SIN `withViewTransitions()` (16-nov-2026). Con él, el router espera a que el navegador llame al callback de `document.startViewTransition`
    // antes de activar la ruta; si esa transición no llega a correr (pestaña en segundo plano, o una transición anterior que se quedó a medias),
    // la navegación no termina NUNCA: ni enlaces ni el buscador hacen nada hasta recargar. Lo reportó Felipe («busqué y no buscó hasta recargar»)
    // y se reprodujo con `document.activeViewTransition` atorada. La animación era cosmética; el movimiento de la tienda vive en motion.css.
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })),
    provideHttpClient(withFetch(), withInterceptors([storeKeyInterceptor])),
    provideClientHydration(withEventReplay()),
    provideAppInitializer(() => { inject(DOCUMENT).documentElement?.setAttribute('data-brand', inject(BRAND).id); }),
  ],
};
