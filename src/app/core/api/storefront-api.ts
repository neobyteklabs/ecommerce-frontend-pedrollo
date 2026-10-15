import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpInterceptorFn, httpResource } from '@angular/common/http';

/** Base de la API de tienda. En el navegador es '' (mismo origen: server.ts hace de proxy y pone la llave);
 *  en SSR la config de servidor la sobreescribe con BACKOFFICE_URL (absoluta, no hay origen relativo). */
export const API_BASE = new InjectionToken<string>('API_BASE', { providedIn: 'root', factory: () => '' });
/** Llave de tienda (X-Store-Key). SOLO la provee la config de servidor desde process.env; en el navegador es ''. */
export const STORE_KEY = new InjectionToken<string>('STORE_KEY', { providedIn: 'root', factory: () => '' });

/** Contrato §3.6 del hand-off de backend (bala 1) + llave de tienda (bala 1b). Identificadores en inglés, valores en español. */
export interface StorefrontPrice { amount: number; currency: 'MXN'; taxIncluded: boolean; net: number; tax: number; calculatedAt: string; }
export interface StorefrontProduct {
  slug: string; catalogProductId: number; model: string; family: string; subtype: string | null; series: string | null;
  supplier: { id: number | null; slug: string | null }; price: StorefrontPrice | null; availability: string | null;
  attributes: Record<string, unknown>; sectionNote: string | null; description: string | null; imageKey: string | null; fichaKey: string | null;
}

/** Añade X-Store-Key solo cuando hay llave (SSR) y la petición va al back-office. En el bundle del navegador STORE_KEY es '' y no hace nada. */
export const storeKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const key = inject(STORE_KEY); const base = inject(API_BASE);
  return key && base && req.url.startsWith(base) ? next(req.clone({ setHeaders: { 'X-Store-Key': key } })) : next(req);
};

@Injectable({ providedIn: 'root' })
export class StorefrontApi {
  private base = inject(API_BASE);
  /** La ficha pública. Debe llamarse en contexto de inyección (campo de componente). */
  product(slug: () => string) {
    return httpResource<StorefrontProduct>(() => `${this.base}/api/tienda/v1/productos/${encodeURIComponent(slug())}`);
  }
}
