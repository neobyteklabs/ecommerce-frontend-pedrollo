import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/** El único nombre por el que se indexa la tienda (el mismo `CANONICAL_HOST` del servidor; `www` redirige aquí). */
export const SITE = 'https://pedrollobombas.com';
const SITE_NAME = 'Pedrollo · Bombas y Sistemas Vega';
/** Imagen para cuando se comparte una página sin foto propia (1200×630, JPG: WhatsApp no pinta SVG ni siempre WebP). */
const DEFAULT_IMAGE = '/media/comercial/og-tienda.jpg';
export const DEFAULT_DESCRIPTION = 'Bombas Pedrollo en México con precio en línea, existencia y factura. Distribuidor autorizado: periféricas, centrífugas, multietapas, sumergibles y pozo profundo. Envío a todo el país.';

export interface PageSeo {
  /** Ruta canónica de la página, sin dominio ni consulta: `/producto/cpm-620`. */
  path: string;
  description: string;
  /** Foto para compartir; relativa o absoluta. Sin ella va la de la tienda. */
  image?: string | null;
  type?: 'website' | 'product';
  /** Datos estructurados (schema.org) de la página; `null` los quita. */
  jsonLd?: object | null;
}

const absolute = (u: string) => /^https?:\/\//.test(u) ? u : SITE + (u.startsWith('/') ? u : '/' + u);
/** Una línea, sin espacios dobles, cortada en palabra: lo que Google muestra bajo el título ronda los 160 caracteres. */
export const clip = (t: string, max = 160) => { const s = t.replace(/\s+/g, ' ').trim(); return s.length <= max ? s : s.slice(0, s.lastIndexOf(' ', max - 1)).replace(/[\s,;:·.]+$/, '') + '…'; };

/**
 * Lo que leen los buscadores y las vistas previas de enlaces (WhatsApp, Facebook): dirección canónica, descripción,
 * Open Graph y datos estructurados. Se escribe en el servidor (SSR), así que llega en el HTML sin esperar scripts.
 *
 * Cada navegación pone lo genérico (`page`); la página que sabe más —producto, serie, categoría— lo afina (`set`).
 */
@Injectable({ providedIn: 'root' })
export class Seo {
  private meta = inject(Meta); private title = inject(Title); private doc = inject(DOCUMENT);
  /** La ruta que una página ya afinó: la navegación que la trajo no debe pisarla con lo genérico. */
  private claimed: string | null = null;

  /** Lo genérico de cualquier página, a partir de su URL (se ignoran consulta y ancla: `?orden=precio` no es otra página). */
  page(url: string) {
    const path = url.split(/[?#]/)[0] || '/';
    if (this.claimed === path) { return; }
    this.claimed = null;
    this.write({ path, description: DEFAULT_DESCRIPTION, jsonLd: null });
  }

  set(s: PageSeo) { this.claimed = s.path; this.write(s); }

  private write(s: PageSeo) {
    const url = SITE + (s.path === '/' ? '/' : s.path.replace(/\/+$/, '')), description = clip(s.description), title = this.title.getTitle();
    const image = absolute(s.image || DEFAULT_IMAGE);
    this.link('canonical', url);
    this.meta.updateTag({ name: 'description', content: description });
    for (const [property, content] of [['og:site_name', SITE_NAME], ['og:locale', 'es_MX'], ['og:type', s.type ?? 'website'], ['og:url', url],
      ['og:title', title], ['og:description', description], ['og:image', image]] as const) { this.meta.updateTag({ property, content }); }
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.jsonLd(s.jsonLd ?? null);
  }

  /** El título puede llegar después (lo pone la página): quien lo cambia avisa para que la vista previa no se quede con el viejo. */
  retitle() { this.meta.updateTag({ property: 'og:title', content: this.title.getTitle() }); }

  private link(rel: string, href: string) {
    let el = this.doc.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!el) { el = this.doc.createElement('link'); el.setAttribute('rel', rel); this.doc.head.appendChild(el); }
    el.setAttribute('href', href);
  }

  private jsonLd(data: object | null) {
    let el = this.doc.head.querySelector<HTMLScriptElement>('script#ld-pagina');
    if (!data) { el?.remove(); return; }
    if (!el) { el = this.doc.createElement('script'); el.id = 'ld-pagina'; el.type = 'application/ld+json'; this.doc.head.appendChild(el); }
    // `<` escapado: un texto del catálogo con «</script>» no puede cerrar la etiqueta.
    el.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  }
}

/** Datos estructurados de una ficha (schema.org/Product). Sin precio no se anuncia oferta: Google rechaza una oferta sin él. */
export function productJsonLd(p: { path: string; model: string; name: string; description: string; image?: string | null; price: number | null; inStock: boolean; seller: string }): object {
  return {
    '@context': 'https://schema.org', '@type': 'Product', name: `Pedrollo ${p.model}`, description: clip(p.description, 300), sku: p.model, mpn: p.model,
    brand: { '@type': 'Brand', name: 'Pedrollo' }, category: p.name, ...(p.image ? { image: [absolute(p.image)] } : {}),
    ...(p.price != null ? { offers: { '@type': 'Offer', url: SITE + p.path, priceCurrency: 'MXN', price: p.price.toFixed(2),
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/BackOrder', itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: p.seller } } } : {}),
  };
}

/**
 * El título de las rutas: las que no nombran la marca («Contacto», «Carrito») la llevan al final, y la vista previa del enlace
 * se entera del título nuevo (el enrutador lo pone DESPUÉS de avisar que terminó la navegación).
 */
@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  private title = inject(Title); private seo = inject(Seo);
  override updateTitle(snapshot: RouterStateSnapshot) {
    const t = this.buildTitle(snapshot);
    if (t !== undefined) { this.title.setTitle(/pedrollo/i.test(t) ? t : `${t} · Pedrollo · Bombas y Sistemas Vega`); }
    this.seo.retitle();
  }
}
