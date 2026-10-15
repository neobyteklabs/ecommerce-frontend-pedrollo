import { Injectable, signal, computed, inject } from '@angular/core';
import { RESOURCES, ModelResources, SeriesResources, ModelCuts, modelSlug } from './resources';
import { ReviewService } from './review';
import preciosDemo from './data/precios_demo.json';

/** DEMO: precios de lista del CSV × 1.15 (tools/precios_demo.py). Quitar cuando llegue la API de precios BSV. */
const PRECIOS_DEMO: Record<string, number> = (preciosDemo as any).precios;

export type Availability = 'stock' | 'pedido' | 'agotado';
/** Producto = modelo del CRM. Sin precio ni disponibilidad hasta que lleguen de BSV (null = por confirmar). */
export interface Product {
  id: string; model: string; name: string; family: string; familyName: string; serie: string; serieName: string;
  price: number | null; avail: Availability | null;
  hp: number | null; kw: number | null; phase: string | null; voltages: string[]; validated: boolean; nota?: string;
  catalog: string | null; catalogIsSeriesPhoto: boolean; hero: string | null; gallery: string[]; technical: string | null; video: string | null;
  enCrm: boolean; cuts: ModelCuts | null;
}

function toProduct(f: { slug: string; nombre: string }, s: SeriesResources, m: ModelResources): Product {
  return {
    id: modelSlug(m.modelo), model: m.modelo, name: `Serie ${s.serie} · ${titleCase(f.nombre)}`, family: f.slug, familyName: titleCase(f.nombre), serie: s.slug, serieName: s.serie,
    price: PRECIOS_DEMO[modelSlug(m.modelo)] ?? null, avail: null,
    hp: m.hp, kw: m.kw, phase: m.fase, voltages: m.tensiones, validated: m.validado, nota: m.nota,
    catalog: m.catalog, catalogIsSeriesPhoto: m.catalog_es_foto_de_serie, hero: m.hero, gallery: m.gallery, technical: m.technical, video: m.video,
    enCrm: m.en_crm, cuts: m.recortes ?? null,
  };
}
const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s|\()([a-záéíóúñ])/g, (_, a, b) => a + b.toUpperCase()).replace(/\bInox\.?/g, 'Inox.');

export const PRODUCTS: Product[] = RESOURCES.flatMap(f => f.series.flatMap(s => s.modelos.map(m => toProduct(f, s, m))));

export const availLabel = (a: Availability | null) => a ? ({ stock: 'En existencia · envío 24–48 h', pedido: 'Sobre pedido · entrega 5–7 días', agotado: 'No disponible por ahora' })[a] : 'Disponibilidad por confirmar';
export const mxn = (n: number | null | undefined) => n == null ? 'Por confirmar' : '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const IVA = 0.16;
export const specLine = (p: Product) => p.validated ? [p.hp != null ? `${p.hp} HP` : null, p.kw != null ? `${p.kw} kW` : null, p.phase, p.voltages.length ? p.voltages.join(' / ') : null].filter(Boolean).join(' · ') : 'Especificaciones pendientes de ficha 60 Hz';

/** Un recorte técnico se publica solo si está aprobado, o en modo revisión. */
export const cutsVisible = (c: ModelCuts | null | undefined, review: boolean) => !!c && (c.aprobado || review);

@Injectable({ providedIn: 'root' })
export class ProductService {
  private review = inject(ReviewService);
  /** Catálogo publicable: modelos del CRM; los que solo están en la ficha aparecen en modo revisión. */
  readonly all = computed<Product[]>(() => PRODUCTS.filter(p => p.enCrm || this.review.on()));
  readonly reviewMode = this.review.on;
  /** Destacados: modelos validados y con foto, priorizando la campaña activa (2CP). */
  readonly featured = computed(() => { const xs = this.all().filter(p => p.catalog && p.validated); return [...xs.filter(p => p.serie === '2cp'), ...xs.filter(p => p.serie !== '2cp')].slice(0, 8); });
  byId(id: string) { return PRODUCTS.find(p => p.id === id); }
  isPublishable(p: Product) { return p.enCrm || this.review.on(); }
  byFamily(slug: string) { return this.all().filter(p => p.family === slug); }
  bySeries(slug: string) { return this.all().filter(p => p.serie === slug); }
  search(q: string) { const n = (s: string) => s.toLowerCase().replace(/\s+/g, ''); const k = n(q); return k ? this.all().filter(p => n(p.model + p.name + p.serieName + p.familyName + (p.hp ?? '') + 'hp').includes(k)) : []; }
  related(id: string, n = 4) { const p = this.byId(id); return this.all().filter(x => x.id !== id && (!p || x.serie === p.serie || x.family === p.family)).slice(0, n); }
}
