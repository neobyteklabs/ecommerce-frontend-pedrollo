import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpInterceptorFn, httpResource } from '@angular/common/http';

/** Base de la API de tienda. En el navegador es '' (mismo origen: server.ts hace de proxy y pone la llave);
 *  en SSR la config de servidor la sobreescribe con BACKOFFICE_URL (absoluta, no hay origen relativo). */
export const API_BASE = new InjectionToken<string>('API_BASE', { providedIn: 'root', factory: () => '' });
/** Llave de tienda (X-Store-Key). SOLO la provee la config de servidor desde process.env; en el navegador es ''. */
export const STORE_KEY = new InjectionToken<string>('STORE_KEY', { providedIn: 'root', factory: () => '' });

/** Contrato §3.6 del hand-off de backend (bala 1) + llave de tienda (bala 1b). Identificadores en inglés, valores en español. */
export interface StorefrontPrice {
  amount: number; currency: 'MXN'; taxIncluded: boolean; net: number; tax: number; calculatedAt: string;
  /** Solo si hay promoción vigente (bala 3): precio con IVA antes de la promoción, para el tachado. */
  before?: number; promotion?: { label: string; until: string };
}
/** Listados (bala F1). Identificadores en inglés, valores en español tal como vienen del catálogo. */
export interface StorefrontFamily { slug: string; name: string; count: number; }
export interface StorefrontSeries { slug: string; name: string; familySlug: string; count: number; }
export interface StorefrontProductSummary {
  slug: string; catalogProductId: number; model: string; family: string | null; familySlug: string | null;
  series: string | null; seriesSlug: string | null; price: StorefrontPrice | null; availability: string | null;
  hp: string | null; phase: string | null; voltage: string | null; imageKey: string | null;
}
export interface StorefrontPage { content: StorefrontProductSummary[]; totalElements: number; totalPages: number; number: number; size: number; }
export interface FacetValue { value: string; count: number; }
export interface StorefrontFacets { hp: FacetValue[]; tension: FacetValue[]; fase: FacetValue[]; }
export type ListingOrder = 'serie' | 'hp-asc' | 'hp-desc' | 'precio-asc' | 'precio-desc';
export interface ListingParams { familia?: string; serie?: string; q?: string; hp?: string; tension?: string; fase?: string; orden?: ListingOrder; page?: number; size?: number; }
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
  /** Familias visibles con conteo. */
  families() { return httpResource<StorefrontFamily[]>(() => `${this.base}/api/tienda/v1/familias`); }
  /** Series de una familia (slug). `undefined` no pide nada. */
  series(familia: () => string | undefined) {
    return httpResource<StorefrontSeries[]>(() => { const f = familia(); return f ? { url: `${this.base}/api/tienda/v1/series`, params: { familia: f } } : undefined; });
  }
  /** Listado con filtros, orden y paginación. `undefined` no pide nada (p. ej. búsqueda sin término). */
  products(params: () => ListingParams | undefined) {
    return httpResource<StorefrontPage>(() => { const q = params(); return q ? { url: `${this.base}/api/tienda/v1/productos`, params: clean(q) } : undefined; });
  }
  /** Facetas (conteos por HP, tensión y fase) del conjunto familia/serie/q. */
  facets(params: () => Pick<ListingParams, 'familia' | 'serie' | 'q'> | undefined) {
    return httpResource<StorefrontFacets>(() => { const q = params(); return q ? { url: `${this.base}/api/tienda/v1/productos/facetas`, params: clean(q) } : undefined; });
  }
}

/** Quita claves vacías: la API trata `hp=` como filtro y un parámetro ausente como «sin filtro». */
function clean(q: object): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(q)) { if (v !== undefined && v !== null && v !== '') out[k] = v as string | number; }
  return out;
}
