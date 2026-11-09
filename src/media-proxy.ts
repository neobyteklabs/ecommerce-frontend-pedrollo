/**
 * Proxy de medios (bala 11, C0): las imágenes que sube el portal viven en el back-office (`GET /media/{tenant}/{uso}/{hash}.{ext}`, público y
 * `immutable`). El navegador las pide a su propio origen y este proxy las reenvía SIN `X-Store-Key` (no la necesitan). Con CDN
 * (`APP_MEDIA_PUBLIC_URL` del back-office) las URLs llegan absolutas y este proxy no interviene.
 *
 * Si el back-office responde 302 (almacén S3), `fetch` lo sigue (`redirect: 'follow'`) y se sirven los bytes: así el navegador nunca ve el
 * origen del CDN a través de la tienda y el caso es el mismo que el del disco.
 */

/** Lo único que puede ser una key de medios; todo lo demás se rechaza antes de pedirlo al back-office. */
export const MEDIA_KEY_PATH = /^\/media\/[a-z0-9][a-z0-9-]*\/(producto|banner)\/[0-9a-f]{16}\.(webp|png|jpg)$/;

export const isMediaKeyPath = (path: string): boolean => MEDIA_KEY_PATH.test(path);

/** Tamaño máximo de la respuesta (las imágenes válidas pesan ≤ 2 MB). */
export const MEDIA_MAX_BYTES = 8 * 1024 * 1024;

export interface MediaReq { method: string; path: string; originalUrl: string }
export interface MediaRes {
  status(code: number): MediaRes;
  setHeader(name: string, value: string): unknown;
  send(body?: Uint8Array | string): unknown;
}

/** Devuelve el manejador de `GET /media/**`. `fetchFn` se inyecta para probarlo sin red. */
export function mediaHandler(backofficeUrl: string, fetchFn: typeof fetch = fetch) {
  return async (req: MediaReq, res: MediaRes): Promise<void> => {
    if (req.method !== 'GET') {
      res.status(405).setHeader('Allow', 'GET');
      res.send();
      return;
    }
    if (!isMediaKeyPath(req.path)) {
      res.status(404).setHeader('Cache-Control', 'no-store');
      res.send();
      return;
    }
    if (!backofficeUrl) {
      res.status(502).send();
      return;
    }
    try {
      const upstream = await fetchFn(`${backofficeUrl}${req.originalUrl}`, {
        headers: { Accept: 'image/*' },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
      const declared = Number(upstream.headers.get('content-length') ?? 0);
      const body = new Uint8Array(await upstream.arrayBuffer());
      if (declared > MEDIA_MAX_BYTES || body.length > MEDIA_MAX_BYTES) {
        res.status(502).send();
        return;
      }
      res.status(upstream.status);
      const type = upstream.headers.get('content-type');
      if (type) res.setHeader('Content-Type', type);
      // Aquí SÍ se respeta el Cache-Control del upstream (immutable un año): la key lleva el hash del contenido.
      const cache = upstream.headers.get('cache-control');
      res.setHeader('Cache-Control', cache ?? 'no-store');
      res.send(body);
    } catch {
      // Lo pide un <img>: nada de JSON.
      res.status(502).send();
    }
  };
}
