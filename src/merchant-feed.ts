/**
 * Catálogo para Google Merchant Center (listados gratuitos y campañas de Shopping). Lo arma el servidor del listado publicado, igual que
 * el sitemap, para que precio y existencia no se desactualicen. Solo entra lo que se puede comprar hoy en la tienda: en carrito, con
 * precio y con foto (Google rechaza un producto sin imagen). Lo que es «a cotizar» no se anuncia.
 */
export interface FeedProduct {
  slug: string; model: string; family?: string | null; familySlug?: string | null; series?: string | null; seriesSlug?: string | null;
  hp?: string | null; imagen?: string | null; price?: { amount: number; currency: string } | null; availability?: { state: string } | null;
}
export interface FeedPage { content: FeedProduct[]; totalPages: number }
export interface FeedItem { id: string; title: string; description: string; link: string; image: string; price: string; mpn: string; type: string }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SEGMENT = /^[a-z0-9][a-z0-9._-]*$/i;
const sentence = (s: string) => { const t = s.trim().toLowerCase(); return t ? t[0].toUpperCase() + t.slice(1) : ''; };
const absolute = (origin: string, src: string) => /^https?:\/\//i.test(src) ? src : origin + (src.startsWith('/') ? src : '/' + src);

/** Un producto del listado → su renglón del catálogo, o `null` si no se anuncia. `seriesImage` da la foto oficial de la serie. */
export function feedItem(origin: string, p: FeedProduct, seriesImage: (seriesSlug: string) => string | null): FeedItem | null {
  if (!SEGMENT.test(p.slug) || p.availability?.state !== 'carrito' || !p.price || !(p.price.amount > 0) || p.price.currency !== 'MXN') { return null; }
  const src = p.imagen || (p.seriesSlug ? seriesImage(p.seriesSlug) : null);
  if (!src) { return null; }
  const familia = sentence(p.family ?? ''), hp = (p.hp ?? '').trim();
  // «Bomba» solo si lo es: un tanque, una membrana o un tablero no llevan potencia.
  const nombre = `${hp ? 'Bomba Pedrollo' : 'Pedrollo'} ${p.model}${hp ? ` ${hp} HP` : ''}`;
  return {
    id: p.slug, mpn: p.model, type: familia, link: `${origin}/producto/${p.slug}`, image: absolute(origin, src), price: `${p.price.amount.toFixed(2)} MXN`,
    title: (familia ? `${nombre} · ${familia}` : nombre).slice(0, 150),
    description: `${nombre}${familia ? `, ${familia.toLowerCase()}` : ''}${p.series ? `, serie ${p.series}` : ''}. Nueva, con garantía, factura y envío gratis a todo México. Distribuidor autorizado Pedrollo.`,
  };
}

export async function feedItems(origin: string, fetchPage: (page: number) => Promise<FeedPage>, seriesImage: (seriesSlug: string) => string | null, maxPages = 50): Promise<FeedItem[]> {
  const out = new Map<string, FeedItem>();
  for (let page = 0, total = 1; page < total && page < maxPages; page++) {
    const r = await fetchPage(page);
    total = r.totalPages;
    for (const p of r.content) { const it = feedItem(origin, p, seriesImage); if (it) { out.set(it.id, it); } }
  }
  return [...out.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function feedXml(origin: string, items: FeedItem[]): string {
  const item = (i: FeedItem) => ['  <item>', `<g:id>${esc(i.id)}</g:id>`, `<g:title>${esc(i.title)}</g:title>`, `<g:description>${esc(i.description)}</g:description>`,
    `<g:link>${esc(i.link)}</g:link>`, `<g:image_link>${esc(i.image)}</g:image_link>`, '<g:availability>in_stock</g:availability>', `<g:price>${i.price}</g:price>`,
    '<g:brand>Pedrollo</g:brand>', `<g:mpn>${esc(i.mpn)}</g:mpn>`, '<g:condition>new</g:condition>', ...(i.type ? [`<g:product_type>${esc(i.type)}</g:product_type>`] : []),
    '</item>'].join('\n    ').replace('\n    </item>', '\n  </item>');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n  <title>Pedrollo · Bombas y Sistemas Vega</title>\n'
    + `  <link>${esc(origin)}</link>\n  <description>Bombas Pedrollo en existencia</description>\n` + items.map(item).join('\n') + '\n</channel>\n</rss>\n';
}
