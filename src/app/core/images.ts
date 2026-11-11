import { RESOURCES } from './resources';
import seriesMedia from './data/series-media.json';

/** Resolución de imágenes por nombre de hueco, derivada del manifiesto de recursos.
 *  Convención de huecos:
 *   serie-<slug>-hero | serie-<slug>-banner  → comerciales (representativos de la serie)
 *   catalog-<slug>                            → foto oficial de la serie (técnica, fondo blanco)
 *   cat-<familia>                             → foto oficial de la primera serie con foto (representativa de la familia)
 *   hero-home / banner-marca                  → campaña activa (hoy: serie 2CP)
 *   serie-<slug>-<pestaña> | curva-<slug> | detalle-… | tile-…  → páginas de serie (data/series-media.json)
 *  Sin coincidencia → null y el hueco se muestra como placeholder identificable. */
const IMAGES: Record<string, string> = { 'hero-home': 'media/comercial/multietapas/2cp/hero.webp', 'banner-marca': 'media/comercial/multietapas/2cp/banner.webp' };
for (const f of RESOURCES) {
  for (const s of f.series) {
    if (s.comercial.hero) IMAGES[`serie-${s.slug}-hero`] = s.comercial.hero;
    if (s.comercial.banner) IMAGES[`serie-${s.slug}-banner`] = s.comercial.banner;
    if (s.tecnico.foto_oficial) { IMAGES[`catalog-${s.slug}`] = s.tecnico.foto_oficial; IMAGES[`cat-${f.slug}`] ??= s.tecnico.foto_oficial; }
  }
}
/** Imágenes de las páginas de serie instaladas con `tools/series/instalar_lote_series.py --aprobar` (hueco → ruta). Lo que ya resuelve
 *  el manifiesto del banco gana: un lote no pisa un recurso aprobado. */
for (const [hueco, ruta] of Object.entries(seriesMedia as Record<string, string>)) IMAGES[hueco] ??= ruta;
export function imageFor(slot: string): string | null {
  if (IMAGES[slot]) return IMAGES[slot];
  const key = slot.split(' · ')[0].trim();
  return IMAGES[key] ?? null;
}

/** Slugs de las series que ya tienen hero (manifiesto del banco o lote instalado): las que la portada puede presumir. */
export const seriesWithHero = (): string[] => Object.keys(IMAGES).map(k => /^serie-(.+)-hero$/.exec(k)?.[1]).filter((s): s is string => !!s);
