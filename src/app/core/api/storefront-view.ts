import { StorefrontProduct, StorefrontProductSummary } from './storefront-api';
import { Product, mxn } from '../products';
import { imageFor } from '../images';
import { familyBySlug } from '../catalog';
import { modelSlug } from '../resources';

/** Lo que una tarjeta de producto necesita pintar. Lo producen la API (listados, bala F1) y el catálogo local
 *  (relacionados de la ficha). Imagen = foto oficial de la SERIE desde el manifiesto local, por slug de serie. */
export interface CardItem {
  id: string; model: string; name: string; serie: string; serieName: string; catalog: string | null;
  price: number | null; before: number | null; promoLabel: string | null; avail: 'carrito' | 'cotizar' | null;
  specs: string; specsPending: boolean;
  /** Bala 11: primera imagen estilizada de la tienda (desde la API); gana sobre `catalog`. */
  imagen?: string | null;
}

const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s|\()([a-záéíóúñ])/g, (_, a, b) => a + b.toUpperCase()).replace(/\bInox\.?/g, 'Inox.');

export function cardFromSummary(p: StorefrontProductSummary): CardItem {
  const serieSlug = p.seriesSlug ?? '';
  const familyName = (p.familySlug && familyBySlug(p.familySlug)?.name) || (p.family ? titleCase(p.family) : '');
  const specs = [p.hp ? `${p.hp} HP` : null, p.phase, p.voltage ? `${p.voltage} V` : null].filter(Boolean).join(' · ');
  return {
    id: p.slug, model: p.model, name: `Serie ${p.series ?? '—'}${familyName ? ' · ' + familyName : ''}`,
    serie: serieSlug, serieName: p.series ?? '', catalog: imageFor(`catalog-${serieSlug}`),
    price: p.price?.amount ?? null, before: p.price?.before ?? null, promoLabel: p.price?.promotion?.label ?? null,
    avail: p.availability?.state ?? null, specs: specs || 'Especificaciones pendientes', specsPending: !specs,
    imagen: p.imagen ?? null,
  };
}

export function cardFromProduct(p: Product): CardItem {
  const specs = p.validated ? [p.hp != null ? `${p.hp} HP` : null, p.kw != null ? `${p.kw} kW` : null, p.phase, p.voltages.length ? p.voltages.join(' / ') : null].filter(Boolean).join(' · ') : '';
  return { id: p.id, model: p.model, name: p.name, serie: p.serie, serieName: p.serieName, catalog: p.catalog, price: p.price, before: null, promoLabel: null, avail: p.avail, specs: specs || 'Especificaciones pendientes de ficha 60 Hz', specsPending: !p.validated };
}

/**
 * La ficha de un producto que el manifiesto local no conoce (11-nov). El manifiesto del 9-oct solo trae una muestra de modelos por serie;
 * al publicar el catálogo completo, 574 de 914 productos daban «Producto no encontrado» aunque la API los devolvía con precio.
 * Aquí se arma el mismo `Product` con lo que da la API: la foto es la oficial de la SERIE y las especificaciones quedan como no validadas
 * contra la ficha 60 Hz (se muestran las de la lista de precios cuando existen).
 */
export function productFromApi(r: StorefrontProduct): Product {
  const serie = r.series ? modelSlug(r.series) : ''; const family = modelSlug(r.family ?? '');
  const familyName = familyBySlug(family)?.name || (r.family ? titleCase(r.family) : '');
  const a = r.attributes ?? {}; const num = (v: unknown) => { const n = parseFloat(String(v ?? '')); return Number.isFinite(n) ? n : null; };
  const volt = String(a['voltaje'] ?? '').split('/').map(v => v.trim()).filter(Boolean);
  return {
    id: r.slug, model: r.model, name: `Serie ${r.series ?? '—'}${familyName ? ' · ' + familyName : ''}`, family, familyName, serie, serieName: r.series ?? '',
    price: null, avail: null, hp: num(a['hp']), kw: num(a['kw']), phase: null, voltages: volt, validated: false,
    catalog: imageFor(`catalog-${serie}`), catalogIsSeriesPhoto: true, hero: imageFor(`serie-${serie}-hero`), gallery: [], technical: null, video: null,
    enCrm: true, cuts: null,
  };
}

export { mxn };
