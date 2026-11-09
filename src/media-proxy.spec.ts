import { describe, expect, it } from 'vitest';
import { isMediaKeyPath, mediaHandler } from './media-proxy';

function fakeRes() {
  const r = { code: 0, headers: {} as Record<string, string>, body: undefined as unknown,
    status(c: number) { r.code = c; return r; }, setHeader(n: string, v: string) { r.headers[n] = v; }, send(b?: unknown) { r.body = b; } };
  return r;
}
const KEY = '/media/pedrollo/banner/3f9a1c2e7b4d6a80.webp';

describe('proxy de medios (C0)', () => {
  it('solo acepta keys de medios', () => {
    expect(isMediaKeyPath(KEY)).toBe(true);
    expect(isMediaKeyPath('/media/pedrollo/producto/3f9a1c2e7b4d6a80.png')).toBe(true);
    for (const bad of ['/media/pedrollo/banner/abc.webp', '/media/pedrollo/logo/3f9a1c2e7b4d6a80.webp', '/media/../etc/passwd',
      '/media/pedrollo/banner/3f9a1c2e7b4d6a80.svg', '/media/Pedrollo/banner/3f9a1c2e7b4d6a80.webp', '/media/pedrollo/banner/3f9a1c2e7b4d6a80.webp/x', '/media']) {
      expect(isMediaKeyPath(bad), bad).toBe(false);
    }
  });

  it('key válida: reenvía sin X-Store-Key y conserva Content-Type y Cache-Control', async () => {
    let seen: { url: string; headers: Record<string, string> } | null = null;
    const fetchFn = (async (url: string, init: RequestInit) => {
      seen = { url, headers: init.headers as Record<string, string> };
      return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=31536000, immutable' } });
    }) as unknown as typeof fetch;
    const res = fakeRes();
    await mediaHandler('http://back:8082', fetchFn)({ method: 'GET', path: KEY, originalUrl: KEY }, res);
    expect(seen!.url).toBe('http://back:8082' + KEY);
    expect(Object.keys(seen!.headers).map(k => k.toLowerCase())).not.toContain('x-store-key');
    expect(res.code).toBe(200);
    expect(res.headers['Content-Type']).toBe('image/webp');
    expect(res.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect((res.body as Uint8Array).length).toBe(3);
  });

  it('key inválida → 404 sin pedir nada; POST → 405; upstream caído → 502 vacío', async () => {
    let calls = 0;
    const boom = (async () => { calls++; throw new Error('down'); }) as unknown as typeof fetch;
    const h = mediaHandler('http://back:8082', boom);
    const r404 = fakeRes(); await h({ method: 'GET', path: '/media/x/y', originalUrl: '/media/x/y' }, r404);
    expect(r404.code).toBe(404); expect(calls).toBe(0);
    const r405 = fakeRes(); await h({ method: 'POST', path: KEY, originalUrl: KEY }, r405);
    expect(r405.code).toBe(405); expect(calls).toBe(0);
    const r502 = fakeRes(); await h({ method: 'GET', path: KEY, originalUrl: KEY }, r502);
    expect(r502.code).toBe(502); expect(r502.body).toBeUndefined();
  });

  it('una respuesta de más de 8 MB se rechaza', async () => {
    const big = (async () => new Response(new Uint8Array(8 * 1024 * 1024 + 1), { status: 200 })) as unknown as typeof fetch;
    const res = fakeRes(); await mediaHandler('http://back', big)({ method: 'GET', path: KEY, originalUrl: KEY }, res);
    expect(res.code).toBe(502);
  });
});
