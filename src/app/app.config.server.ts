import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { API_BASE, STORE_KEY } from './core/api/storefront-api';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Solo en el proceso Node: la URL absoluta del back-office y la llave de tienda. Nunca llegan al bundle del navegador.
    { provide: API_BASE, useFactory: () => process.env['BACKOFFICE_URL'] ?? '' },
    { provide: STORE_KEY, useFactory: () => process.env['STORE_KEY'] ?? '' },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
