import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { isMediaKeyPath, mediaHandler } from './media-proxy';
import { robotsTxt, sitemapPaths, sitemapXml, SitemapPage } from './sitemap';
import { buyerOf, clearedCookie, looksLikeSession, readSessionCookie, sessionCookie } from './account-proxy';

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

/**
 * robots.txt y sitemap.xml (ver sitemap.ts). `CANONICAL_HOST` es el único dominio que se deja indexar; cualquier otro nombre por el
 * que se sirva la tienda (la URL provisional, la IP, el del balanceador) responde «Disallow: /». El mapa se guarda una hora en memoria.
 */
const CANONICAL_HOST = (process.env['CANONICAL_HOST'] ?? 'pedrollobombas.com').toLowerCase();
app.get('/robots.txt', (req, res) => { res.type('text/plain').setHeader('Cache-Control', 'public, max-age=3600'); res.send(robotsTxt(req.headers.host, CANONICAL_HOST)); });
let sitemapCache: { at: number; xml: string } | null = null;
app.get('/sitemap.xml', async (_req, res) => {
  try {
    if (!sitemapCache || Date.now() - sitemapCache.at > 3_600_000) {
      const page = async (n: number): Promise<SitemapPage> => {
        const up = await fetch(`${BACKOFFICE_URL}/api/tienda/v1/productos?size=100&page=${n}`, { headers: { 'X-Store-Key': STORE_KEY, Accept: 'application/json' } });
        if (!up.ok) throw new Error('listado ' + up.status);
        return await up.json() as SitemapPage;
      };
      sitemapCache = { at: Date.now(), xml: sitemapXml('https://' + CANONICAL_HOST, await sitemapPaths(page)) };
    }
    res.type('application/xml').setHeader('Cache-Control', 'public, max-age=3600'); res.send(sitemapCache.xml);
  } catch { res.status(503).setHeader('Cache-Control', 'no-store').setHeader('Retry-After', '300'); res.end(); }
});

/** Bala 11, C0: las imágenes de tienda y los banners que sube el portal (ver media-proxy.ts). Solo GET; cualquier otro método, 405. */
const media = mediaHandler(BACKOFFICE_URL);
app.all('/media/{*splat}', (req, res, next) => {
  // Solo las keys del back-office pasan por el proxy. Lo demás de /media son los archivos propios de la tienda (public/media: fotos de
  // catálogo, heroes de serie, fichas PDF) y los sirve express.static más abajo; sin este `next()` todos daban 404 fuera de `ng serve`.
  if (!isMediaKeyPath(req.path)) return next();
  const out = {
    status: (c: number) => { res.status(c); return out; },
    setHeader: (n: string, v: string) => res.setHeader(n, v),
    send: (b?: Uint8Array | string) => res.send(typeof b === 'string' || b === undefined ? b : Buffer.from(b)),
  };
  return media(req, out);
});

/**
 * Bala 9 · cuenta del comprador (ver account-proxy.ts). Van ANTES del proxy genérico: son las únicas rutas que tocan la cookie
 * de sesión. El navegador recibe quién es; la sesión firmada no sale de este servidor.
 */
const secureOf = (req: express.Request) => req.secure || req.headers['x-forwarded-proto']?.toString().split(',')[0]?.trim() === 'https';
const backoffice = (path: string, init: RequestInit & { session?: string | null } = {}) => {
  const headers: Record<string, string> = { 'X-Store-Key': STORE_KEY, Accept: 'application/json', ...(init.headers as Record<string, string> ?? {}) };
  if (init.session) headers['X-Buyer-Session'] = init.session;
  return fetch(`${BACKOFFICE_URL}/api/tienda/v1/cuenta${path}`, { ...init, headers, signal: AbortSignal.timeout(8000) });
};
const noStore = (res: express.Response) => res.setHeader('Cache-Control', 'no-store');
const sinSesion = (res: express.Response, req: express.Request) => { res.setHeader('Set-Cookie', clearedCookie(secureOf(req))); res.status(401).json({ code: 'UNAUTHORIZED', message: 'Entra con tu cuenta.', timestamp: new Date().toISOString() }); };
const cuentaCaida = (res: express.Response) => res.status(503).json({ code: 'CATALOG_UNAVAILABLE', message: 'La tienda no pudo consultar el back-office.', timestamp: new Date().toISOString() });

app.post('/__cuenta/entrar', express.json({ limit: '16kb' }), async (req, res) => {
  noStore(res);
  if (req.header('X-Tienda') !== '1') { res.status(403).json({ code: 'FORBIDDEN', message: 'Petición no permitida.', timestamp: new Date().toISOString() }); return; }
  if (CONFIG_ERROR) { res.status(503).json({ code: 'STORE_NOT_CONFIGURED', message: CONFIG_ERROR, timestamp: new Date().toISOString() }); return; }
  if (limited(req, 'entrar', 12)) { res.status(429).json({ code: 'TOO_MANY_REQUESTS', message: 'Demasiados intentos. Espera un minuto.', timestamp: new Date().toISOString() }); return; }
  const credential = typeof req.body?.credential === 'string' ? req.body.credential : '';
  try {
    const up = await backoffice('/sesion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential }) });
    const body = await up.json().catch(() => null) as { sesion?: string } | null;
    const comprador = up.ok ? buyerOf(body) : null;
    if (!comprador || !looksLikeSession(body?.sesion)) { res.status(up.status === 404 ? 404 : 401).json({ code: 'UNAUTHORIZED', message: 'No pudimos verificar tu cuenta de Google. Inténtalo de nuevo.', timestamp: new Date().toISOString() }); return; }
    res.setHeader('Set-Cookie', sessionCookie(body!.sesion!, secureOf(req)));
    res.json({ comprador });
  } catch { cuentaCaida(res); }
});
app.get('/__cuenta/yo', async (req, res) => {
  noStore(res);
  const session = readSessionCookie(req.headers.cookie);
  // Sin cookie no es un error: es un visitante. 200 con `comprador: null`, para no llenar la consola de 401 en cada visita.
  if (!session || CONFIG_ERROR) { res.json({ comprador: null }); return; }
  try {
    const up = await backoffice('', { session });
    const body = await up.json().catch(() => null) as { sesion?: string } | null;
    const comprador = up.ok ? buyerOf(body) : null;
    if (!comprador) { if (up.status >= 500) { cuentaCaida(res); } else { sinSesion(res, req); } return; }
    if (looksLikeSession(body?.sesion)) res.setHeader('Set-Cookie', sessionCookie(body!.sesion!, secureOf(req)));
    res.json({ comprador });
  } catch { cuentaCaida(res); }
});
app.get('/__cuenta/pedidos', async (req, res) => {
  noStore(res);
  const session = readSessionCookie(req.headers.cookie);
  if (!session || CONFIG_ERROR) { res.status(401).json({ code: 'UNAUTHORIZED', message: 'Entra con tu cuenta.', timestamp: new Date().toISOString() }); return; }
  try {
    const up = await backoffice('/pedidos', { session });
    if (up.status === 401 || up.status === 404) { sinSesion(res, req); return; }
    if (!up.ok) { cuentaCaida(res); return; }
    res.json(await up.json());
  } catch { cuentaCaida(res); }
});
app.post('/__cuenta/salir', (req, res) => {
  noStore(res);
  if (req.header('X-Tienda') !== '1') { res.status(403).json({ code: 'FORBIDDEN', message: 'Petición no permitida.', timestamp: new Date().toISOString() }); return; }
  res.setHeader('Set-Cookie', clearedCookie(secureOf(req))); res.status(204).end();
});
/**
 * Presencia (sección «Actividad» del portal): el navegador avisa «sigo aquí» y este servidor lo pasa al back-office con la llave
 * de tienda. Si el visitante tiene cuenta lo decide ESTE servidor por la cookie de sesión, no el navegador. Siempre 204: la
 * presencia nunca le falla a la página. El límite por IP es amplio a propósito: una oficina entera sale por la misma IP.
 */
app.post('/__latido', express.json({ limit: '1kb' }), (req, res) => {
  noStore(res);
  res.status(204).end();
  const v = typeof req.body?.v === 'string' ? req.body.v : '';
  if (CONFIG_ERROR || req.header('X-Tienda') !== '1' || !/^[a-f0-9]{32}$/.test(v) || limited(req, 'latido', 600)) { return; }
  fetch(`${BACKOFFICE_URL}/api/tienda/v1/presencia`, {
    method: 'POST', headers: { 'X-Store-Key': STORE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitante: v, conCuenta: !!readSessionCookie(req.headers.cookie) }), signal: AbortSignal.timeout(4000),
  }).catch(() => undefined);
});
/** El identificador de cliente de Google de la tienda (público). Se pregunta al back-office y se recuerda 5 minutos; null = la tienda no tiene cuentas. */
let googleClientId: { value: string | null; at: number } | null = null;
async function googleClientIdNow(): Promise<string | null> {
  if (CONFIG_ERROR) { return null; }
  if (googleClientId && Date.now() - googleClientId.at < 5 * 60_000) { return googleClientId.value; }
  try {
    const up = await backoffice('/config');
    const body = up.ok ? await up.json().catch(() => null) as { googleClientId?: string } | null : null;
    if (up.ok || up.status === 404) { googleClientId = { value: typeof body?.googleClientId === 'string' ? body.googleClientId : null, at: Date.now() }; return googleClientId.value; }
  } catch { /* se reintenta en la siguiente petición */ }
  return googleClientId?.value ?? null;
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
const WRITABLE_RE = [/^\/api\/tienda\/v1\/pedidos\/[A-Za-z0-9-]{1,64}\/confirmar$/,
  // Bala 13: cobrar el pedido con la tarjeta tokenizada por el formulario de Mercado Pago (el cuerpo trae el token, nunca la tarjeta).
  /^\/api\/tienda\/v1\/pedidos\/[A-Za-z0-9-]{1,64}\/pagar$/, /^\/api\/tienda\/v1\/seguimiento\/[A-Za-z0-9-]{1,64}\/aceptar$/,
  // Bala 7: la solicitud de factura también escribe (y comparte el límite de «seguimiento»).
  /^\/api\/tienda\/v1\/seguimiento\/[A-Za-z0-9-]{1,64}\/factura$/];
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
/** Bala 13: la clave pública de Mercado Pago (`MP_PUBLIC_KEY`) tampoco es secreta; la usa el formulario de tarjeta en el navegador. */
const MP_PUBLIC_KEY = process.env['MP_PUBLIC_KEY'] ?? '';
app.get('/__config', async (_req, res) => { res.setHeader('Cache-Control', 'no-store'); res.json({ stripePublishableKey: STRIPE_PUBLISHABLE_KEY, mpPublicKey: MP_PUBLIC_KEY, googleClientId: await googleClientIdNow() }); });
app.post('/api/tienda/{*splat}', express.raw({ type: 'application/json', limit: '64kb' }), async (req, res) => {
  if (!isWritable(req.path)) {
    res.status(405).json({ code: 'METHOD_NOT_ALLOWED', message: 'La API de tienda es de solo lectura.', timestamp: new Date().toISOString() });
    return;
  }
  if (CONFIG_ERROR) {
    res.status(503).json({ code: 'STORE_NOT_CONFIGURED', message: CONFIG_ERROR, timestamp: new Date().toISOString() });
    return;
  }
  if ((req.path === '/api/tienda/v1/pedidos' && limited(req, 'pedidos')) || (req.path.endsWith('/pagar') && limited(req, 'pagar', 12)) || (req.path.startsWith('/api/tienda/v1/seguimiento/') && limited(req, 'seguimiento'))) {
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

/** Un archivo de /media que no existe es un 404, no una página: sin esto caía al render de Angular y respondía con una redirección al inicio. */
app.use('/media', (_req, res) => { res.status(404).setHeader('Cache-Control', 'no-store'); res.end(); });

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
