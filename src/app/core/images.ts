import { RESOURCES } from './resources';

/** Resolución de imágenes por nombre de hueco, derivada del manifiesto de recursos.
 *  Convención de huecos:
 *   serie-<slug>-hero | serie-<slug>-banner  → comerciales (representativos de la serie)
 *   catalog-<slug>                            → foto oficial de la serie (técnica, fondo blanco)
 *   cat-<familia>                             → foto oficial de la primera serie con foto (representativa de la familia)
 *   hero-home / banner-marca                  → campaña activa (hoy: serie 2CP)
 *  Sin coincidencia → null y el hueco se muestra como placeholder identificable. */
const IMAGES: Record<string, string> = { 'hero-home': 'media/comercial/multietapas/2cp/hero.webp', 'banner-marca': 'media/comercial/multietapas/2cp/banner.webp' };
for (const f of RESOURCES) {
  for (const s of f.series) {
    if (s.comercial.hero) IMAGES[`serie-${s.slug}-hero`] = s.comercial.hero;
    if (s.comercial.banner) IMAGES[`serie-${s.slug}-banner`] = s.comercial.banner;
    if (s.tecnico.foto_oficial) { IMAGES[`catalog-${s.slug}`] = s.tecnico.foto_oficial; IMAGES[`cat-${f.slug}`] ??= s.tecnico.foto_oficial; }
  }
}
export function imageFor(slot: string): string | null {
  if (IMAGES[slot]) return IMAGES[slot];
  const key = slot.split(' · ')[0].trim();
  return IMAGES[key] ?? null;
}
