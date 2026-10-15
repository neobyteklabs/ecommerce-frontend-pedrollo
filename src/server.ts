import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * La llave de tienda vive SOLO en este proceso (bala 1b del backend). El navegador llama a su
 * propio origen (/api/tienda/...) y aquí se reenvía al back-office con X-Store-Key. Sin las dos
 * variables el servidor no arranca: un proxy sin llave respondería 404 a todo con el log limpio.
 */
const BACKOFFICE_URL = (process.env['BACKOFFICE_URL'] ?? '').replace(/\/$/, '');
const STORE_KEY = process.env['STORE_KEY'] ?? '';
/** Null si la configuración está completa. No se lanza al cargar el módulo: el prerender de `ng build` importa este
 *  archivo para extraer rutas y no necesita el back-office. Se lanza solo al arrancar como proceso (abajo). */
const CONFIG_ERROR = !BACKOFFICE_URL || !STORE_KEY ? 'Faltan BACKOFFICE_URL y/o STORE_KEY (ver README «Arranque»).' : null;
if (CONFIG_ERROR) {
  console.error([
    '',
    '================================================================================',
    ' Tienda sin configurar: faltan BACKOFFICE_URL y/o STORE_KEY en el entorno del servidor.',
    ' La API de tienda responderá 503 hasta que existan.',
    '',
    '   export BACKOFFICE_URL=http://localhost:8082',
    '   export STORE_KEY=<APP_STORE_KEY_PEDROLLO del back-office>',
    '',
    ' Nunca en un archivo versionado ni en el bundle del navegador. Ver README «Arranque».',
    '================================================================================',
    '',
  ].join('\n'));
}

/** Proxy de solo lectura hacia la API de tienda. Devuelve estado, Content-Type y cuerpo tal cual. */
app.get('/api/tienda/{*splat}', async (req, res) => {
  if (CONFIG_ERROR) {
    res.status(503).json({ code: 'STORE_NOT_CONFIGURED', message: CONFIG_ERROR, timestamp: new Date().toISOString() });
    return;
  }
  try {
    const upstream = await fetch(`${BACKOFFICE_URL}${req.originalUrl}`, {
      headers: { 'X-Store-Key': STORE_KEY, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    res.status(upstream.status);
    const type = upstream.headers.get('content-type');
    if (type) res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'no-store');
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(503).json({ code: 'CATALOG_UNAVAILABLE', message: 'La tienda no pudo consultar el back-office.', timestamp: new Date().toISOString() });
  }
});
app.all('/api/tienda/{*splat}', (_req, res) => {
  res.status(405).json({ code: 'METHOD_NOT_ALLOWED', message: 'La API de tienda es de solo lectura.', timestamp: new Date().toISOString() });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  if (CONFIG_ERROR) {
    throw new Error('Arranque abortado: ' + CONFIG_ERROR);
  }
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
