import { isCanonicalHost, robotsTxt, sitemapPaths, sitemapXml } from './sitemap';

describe('robots y sitemap', () => {
  it('solo el dominio canónico (con o sin www, con puerto) se deja indexar', () => {
    expect(isCanonicalHost('pedrollobombas.com', 'pedrollobombas.com')).toBe(true);
    expect(isCanonicalHost('WWW.pedrollobombas.com:443', 'pedrollobombas.com')).toBe(true);
    expect(isCanonicalHost('test.pedrollobombas.com', 'pedrollobombas.com')).toBe(false);
    expect(robotsTxt('test.pedrollobombas.com', 'pedrollobombas.com')).toBe('User-agent: *\nDisallow: /\n');
    expect(robotsTxt(undefined, 'pedrollobombas.com')).toContain('Disallow: /\n');
  });

  it('el robots del dominio canónico protege lo personal y anuncia el mapa', () => {
    const r = robotsTxt('pedrollobombas.com', 'pedrollobombas.com');
    expect(r).toContain('Disallow: /checkout');
    expect(r).toContain('Sitemap: https://pedrollobombas.com/sitemap.xml');
    expect(r).not.toContain('Disallow: /\n');
  });

  it('el mapa recorre todas las páginas del listado y descarta identificadores raros', async () => {
    const pages = [
      { totalPages: 2, content: [{ slug: 'pk-60', familySlug: 'perifericas', seriesSlug: 'pk' }, { slug: 'x"><y', familySlug: 'perifericas', seriesSlug: null }] },
      { totalPages: 2, content: [{ slug: '2cp-25-16a', familySlug: 'multietapas', seriesSlug: '2cp' }] },
    ];
    const pedidas: number[] = [];
    const paths = await sitemapPaths(async n => { pedidas.push(n); return pages[n]; });
    expect(pedidas).toEqual([0, 1]);
    expect(paths).toEqual(['/', '/catalogo', '/contacto', '/terminos', '/privacidad', '/categoria/multietapas', '/categoria/perifericas', '/serie/2cp', '/serie/pk', '/producto/2cp-25-16a', '/producto/pk-60']);
    const xml = sitemapXml('https://pedrollobombas.com', paths);
    expect(xml).toContain('<loc>https://pedrollobombas.com/producto/pk-60</loc>');
    expect(xml.match(/<url>/g)?.length).toBe(11);
  });
});
