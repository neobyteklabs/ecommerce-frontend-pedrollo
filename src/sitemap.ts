/**
 * robots.txt y sitemap.xml de la tienda. Los arma el servidor (no son archivos fijos) por dos razones:
 *  - solo el dominio canónico debe indexarse: la URL provisional y cualquier otro nombre responden «Disallow: /»;
 *  - el mapa sale del catálogo publicado (API de tienda), así que no se desactualiza al publicar o retirar productos.
 */
export const isCanonicalHost = (host: string | undefined, canonical: string): boolean => {
  const h = (host ?? '').toLowerCase().replace(/:\d+$/, '');
  return h === canonical || h === 'www.' + canonical;
};

export function robotsTxt(host: string | undefined, canonical: string): string {
  if (!isCanonicalHost(host, canonical)) return 'User-agent: *\nDisallow: /\n';
  // Lo personal o sin contenido propio no se rastrea; la API y los endpoints internos, tampoco.
  return ['User-agent: *', 'Disallow: /api/', 'Disallow: /__', 'Disallow: /carrito', 'Disallow: /checkout', 'Disallow: /cuenta', 'Disallow: /login',
    'Disallow: /pedido/', 'Disallow: /seguimiento/', 'Disallow: /buscar', '', `Sitemap: https://${canonical}/sitemap.xml`, ''].join('\n');
}

export interface SitemapProduct { slug: string; familySlug?: string | null; seriesSlug?: string | null }
export interface SitemapPage { content: SitemapProduct[]; totalPages: number }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SEGMENT = /^[a-z0-9][a-z0-9._-]*$/i;

/** Las rutas indexables: páginas fijas, familias, series y productos publicados. `fetchPage` trae una página del listado de la tienda. */
export async function sitemapPaths(fetchPage: (page: number) => Promise<SitemapPage>, maxPages = 50): Promise<string[]> {
  const fijas = ['/', '/catalogo', '/contacto', '/terminos', '/privacidad'];
  const familias = new Set<string>(), series = new Set<string>(), productos = new Set<string>();
  for (let page = 0, total = 1; page < total && page < maxPages; page++) {
    const r = await fetchPage(page);
    total = r.totalPages;
    for (const p of r.content) {
      if (SEGMENT.test(p.slug)) productos.add(p.slug);
      if (p.familySlug && SEGMENT.test(p.familySlug)) familias.add(p.familySlug);
      if (p.seriesSlug && SEGMENT.test(p.seriesSlug)) series.add(p.seriesSlug);
    }
  }
  return [...fijas, ...[...familias].sort().map(f => '/categoria/' + f), ...[...series].sort().map(s => '/serie/' + s), ...[...productos].sort().map(p => '/producto/' + p)];
}

export function sitemapXml(origin: string, paths: string[]): string {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + paths.map(p => `  <url><loc>${esc(origin + p)}</loc></url>`).join('\n') + '\n</urlset>\n';
}
