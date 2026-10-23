import { StorefrontProductSummary } from './storefront-api';
import { Product, mxn } from '../products';
import { imageFor } from '../images';
import { familyBySlug } from '../catalog';

/** Lo que una tarjeta de producto necesita pintar. Lo producen la API (listados, bala F1) y el catálogo local
 *  (relacionados de la ficha). Imagen = foto oficial de la SERIE desde el manifiesto local, por slug de serie. */
export interface CardItem {
  id: string; model: string; name: string; serie: string; serieName: string; catalog: string | null;
  price: number | null; before: number | null; promoLabel: string | null; avail: 'stock' | 'pedido' | 'agotado' | null;
  specs: string; specsPending: boolean;
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
    avail: (p.availability as CardItem['avail']) ?? null, specs: specs || 'Especificaciones pendientes', specsPending: !specs,
  };
}

export function cardFromProduct(p: Product): CardItem {
  const specs = p.validated ? [p.hp != null ? `${p.hp} HP` : null, p.kw != null ? `${p.kw} kW` : null, p.phase, p.voltages.length ? p.voltages.join(' / ') : null].filter(Boolean).join(' · ') : '';
  return { id: p.id, model: p.model, name: p.name, serie: p.serie, serieName: p.serieName, catalog: p.catalog, price: p.price, before: null, promoLabel: null, avail: p.avail, specs: specs || 'Especificaciones pendientes de ficha 60 Hz', specsPending: !p.validated };
}

export { mxn };
