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

/** Proxy GET hacia la API de tienda (ficha, listados, pedido y seguimiento por folio + contacto, PDF). Devuelve estado, Content-Type y cuerpo tal cual. */
app.get('/api/tienda/{*splat}', async (req, res) => {
  if (CONFIG_ERROR) {
    res.status(503).json({ code: 'STORE_NOT_CONFIGURED', message: CONFIG_ERROR, timestamp: new Date().toISOString() });
    return;
  }
  if (/^\/api\/tienda\/v1\/(seguimiento|pedidos)\//.test(req.path) && limited(req, 'seguimiento')) {
    res.status(429).json({ code: 'TOO_MANY_REQUESTS', message: 'Demasiados intentos. Espera un minuto.', timestamp: new Date().toISOString() });
    return;
  }
  try {
    const upstream = await fetch(`${BACKOFFICE_URL}${req.originalUrl}`, {
      headers: { 'X-Store-Key': STORE_KEY, Accept: req.path.endsWith('.pdf') ? 'application/pdf' : 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    res.status(upstream.status);
    const type = upstream.headers.get('content-type');
    if (type) res.setHeader('Content-Type', type);
    const disp = upstream.headers.get('content-disposition');
    if (disp) res.setHeader('Content-Disposition', disp);
    res.setHeader('Cache-Control', 'no-store');
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(503).json({ code: 'CATALOG_UNAVAILABLE', message: 'La tienda no pudo consultar el back-office.', timestamp: new Date().toISOString() });
  }
});
/** Las escrituras de la tienda (balas 4 y 5) de la tienda (bala 4): envío por CP y cotización. Se reenvía el cuerpo tal cual (bytes) y la
 *  cabecera Idempotency-Key; cualquier otro POST sigue siendo 405. */
const WRITABLE = new Set(['/api/tienda/v1/carrito/envio', '/api/tienda/v1/cotizaciones', '/api/tienda/v1/carrito/cupon', '/api/tienda/v1/pedidos']);
/** Bala 5: confirmar el pago de un pedido (idempotente). Limpieza pre-bala 6: aceptar la cotización desde la tienda (idempotente; la segunda
 *  llave va en `?contacto=`, que viaja en `originalUrl`). */
const WRITABLE_RE = [/^\/api\/tienda\/v1\/pedidos\/[A-Za-z0-9-]{1,64}\/confirmar$/, /^\/api\/tienda\/v1\/seguimiento\/[A-Za-z0-9-]{1,64}\/aceptar$/];
const isWritable = (path: string) => WRITABLE.has(path) || WRITABLE_RE.some(re => re.test(path));

/** Límite por IP, en memoria (bala 5): crear pedidos y consultar seguimiento no deben servir para enumerar folios ni
 *  para martillar al back-office. 30 peticiones por minuto por IP y ruta; detrás de CloudFront llega X-Forwarded-For. */
const RATE: Record<string, { n: number; until: number }> = {};
function limited(req: express.Request, bucket: string, max = 30): boolean {
  const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0] ?? req.ip ?? 'ip').trim();
  const k = `${bucket}:${ip}`; const now = Date.now(); const e = RATE[k];
  if (!e || e.until < now) { RATE[k] = { n: 1, until: now + 60_000 }; return false; }
  e.n++; return e.n > max;
}
setInterval(() => { const now = Date.now(); for (const k of Object.keys(RATE)) if (RATE[k].until < now) delete RATE[k]; }, 60_000).unref();

/** Config pública del navegador (bala 5): la llave publicable de Stripe NO es secreta; vacía = la tienda cobra en modo simulado. */
const STRIPE_PUBLISHABLE_KEY = process.env['STRIPE_PUBLISHABLE_KEY'] ?? '';
app.get('/__config', (_req, res) => { res.setHeader('Cache-Control', 'no-store'); res.json({ stripePublishableKey: STRIPE_PUBLISHABLE_KEY }); });
app.post('/api/tienda/{*splat}', express.raw({ type: 'application/json', limit: '64kb' }), async (req, res) => {
  if (!isWritable(req.path)) {
    res.status(405).json({ code: 'METHOD_NOT_ALLOWED', message: 'La API de tienda es de solo lectura.', timestamp: new Date().toISOString() });
    return;
  }
  if (CONFIG_ERROR) {
    res.status(503).json({ code: 'STORE_NOT_CONFIGURED', message: CONFIG_ERROR, timestamp: new Date().toISOString() });
    return;
  }
  if ((req.path === '/api/tienda/v1/pedidos' && limited(req, 'pedidos')) || (req.path.startsWith('/api/tienda/v1/seguimiento/') && limited(req, 'seguimiento'))) {
    res.status(429).json({ code: 'TOO_MANY_REQUESTS', message: 'Demasiados intentos. Espera un minuto.', timestamp: new Date().toISOString() });
    return;
  }
  try {
    const headers: Record<string, string> = { 'X-Store-Key': STORE_KEY, Accept: 'application/json', 'Content-Type': 'application/json' };
    const idem = req.header('Idempotency-Key'); if (idem) headers['Idempotency-Key'] = idem;
    const upstream = await fetch(`${BACKOFFICE_URL}${req.originalUrl}`, { method: 'POST', headers, body: new Uint8Array(req.body as Buffer), signal: AbortSignal.timeout(8000) });
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
