import recursos from './data/recursos.json';

/** Manifiesto de recursos visuales (generado por generar_manifiesto.py en el banco de imágenes).
 *  Dos categorías:
 *   · comercial: hero/banner/video cinematográficos, REPRESENTATIVOS de la serie (nunca "la foto exacta" de un modelo).
 *   · tecnico: foto oficial de la serie (pedrollo.com.mx) y ficha técnica 60 Hz; datos por modelo extraídos de la ficha. */
/** Recortes fieles de la ficha 60 Hz (paquete técnico por serie). `estado` viene del CSV del paquete:
 *  solo 'aprobado' se publica; 'pendiente aprobacion' se ve únicamente en modo revisión. */
export interface ModelCuts {
  kw: number | null; hp: number | null; curva: string | null; tabla_prestaciones: string | null; tabla_consumos: string | null; pdf_pagina_curva: number | null;
  foto_modelo: string | null; foto_modelo_verificada: boolean; estado: string; aprobado: boolean;
}
export interface SharedCuts { compartidos: Record<string, { path: string | null; pdf_page: number | null }>; meta: { fuente: string | null; frecuencia_hz: number | null; calidad: string | null; notas: string[]; foto_referencial: string | null; alcance_foto: string | null; readme: string | null } | null; }
/** Lote global de revisión: por página de pedrollo.com.mx (slug), primera página de prestaciones y página de componentes
 *  detectadas en el PDF 60 Hz, como página completa sin modificar. Siempre pendiente; solo visible en modo revisión. */
/** Paquete multimedia comercial por serie: catálogo 1:1 y detalles macro derivados sin IA de la foto de referencia de familia.
 *  `tipo_fuente` = family_reference_not_exact_model_verified: nunca se asignan como foto verificada de un modelo. `status` manda. */
export interface MultimediaAsset { path: string; tipo: string | null; derivacion: string | null; verificada_modelo: boolean; etiqueta: string; }
export interface MultimediaPackage {
  paquete: string; status: string; aprobado: boolean; fuente: string | null; tipo_fuente: string | null;
  catalogo: MultimediaAsset[]; macro: MultimediaAsset[]; otros: MultimediaAsset[];
  escena_instalada: { status: string; reason?: string } | null; hero: { status: string; note?: string } | null; nota: string | null; readme: string | null;
}
export interface ReviewPreview {
  slug: string; nombre: string | null; pdf_60hz: string | null; pdf_sha256_coincide: boolean | null;
  pagina_prestaciones: number | null; pagina_componentes: number | null; preview_prestaciones: string | null; preview_componentes: string | null;
  estado_tecnico: string | null; estado_comercial: string | null; imagen_modelo_verificada: boolean; publicable: boolean; observaciones: string; advertencia: string;
}
export interface ModelResources {
  modelo: string; en_crm: boolean; validado: boolean; recortes?: ModelCuts | null; kw: number | null; hp: number | null; fase: string | null; tensiones: string[];
  catalog: string | null; catalog_es_foto_de_serie: boolean; hero: string | null; gallery: string[]; technical: string | null; video: string | null;
  placeholder: { catalog: boolean; hero: boolean; technical: boolean; video: boolean }; nota?: string;
}
export interface SeriesResources {
  slug: string; serie: string; n_productos_crm: number; paginas_pedrollo: string[];
  comercial: { representativo: boolean; hero: string | null; banner: string | null; video: string | null; galeria: string[]; multimedia?: MultimediaPackage[] };
  tecnico: { foto_oficial: string | null; foto_oficial_fuente: string | null; ficha_60hz: string | null; otros_pdf: string[]; galeria: string[]; recortes?: SharedCuts; revision?: ReviewPreview[] };
  modelos: ModelResources[]; modelos_en_ficha_60hz: string[];
}
/** Recursos comerciales por FAMILIA (separados de los técnicos y de los paquetes por serie):
 *  hero estilizado con versiones; `publicable=false` ⇒ solo modo revisión. Imagen de familia, nunca foto verificada de un SKU. */
export interface FamilyHeroVersion { version: number; lote: string; asset_type: string; status: string; publicable: boolean; reference_slug: string | null; notes: string | null; web: string | null; original: string | null; sha256: string; instalado: string; ambito: string; }
export interface FamilyCommercial { hero_stylized: { actual: FamilyHeroVersion | null; versiones: FamilyHeroVersion[]; aprobado: boolean } }
export interface FamilyResources { slug: string; nombre: string; series: SeriesResources[]; comercial?: FamilyCommercial | null; }
export const familyBySlugRes = (slug: string) => RESOURCES.find(f => f.slug === slug) ?? null;
/** Hero estilizado de familia visible: aprobado y publicable, o cualquiera en modo revisión. */
export const familyHero = (slug: string, review: boolean) => { const h = familyBySlugRes(slug)?.comercial?.hero_stylized; if (!h?.actual?.web) return null; return (h.aprobado || review) ? { ...h.actual, pending: !h.aprobado } : null; };

export const RESOURCES: FamilyResources[] = (recursos as any).familias;
export const seriesList = (): SeriesResources[] => RESOURCES.flatMap(f => f.series);
export const seriesBySlug = (slug: string) => seriesList().find(s => s.slug === slug) ?? null;
export const familyOfSeries = (slug: string) => RESOURCES.find(f => f.series.some(s => s.slug === slug)) ?? null;
export const modelSlug = (m: string) => m.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
