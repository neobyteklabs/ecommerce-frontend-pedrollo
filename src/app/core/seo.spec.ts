import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DEFAULT_DESCRIPTION, Seo, clip, productJsonLd } from './seo';

const meta = (d: Document, sel: string) => d.head.querySelector(sel)?.getAttribute('content');

describe('Seo', () => {
  let seo: Seo, doc: Document;
  beforeEach(() => { seo = TestBed.inject(Seo); doc = TestBed.inject(DOCUMENT); TestBed.inject(Title).setTitle('Título de prueba'); });
  afterEach(() => doc.head.querySelectorAll('link[rel="canonical"], script#ld-pagina, meta[property^="og:"], meta[name="description"]').forEach(e => e.remove()));

  it('cada página lleva canónica sin consulta ni www, descripción y Open Graph', () => {
    seo.page('/categoria/multietapas?orden=precio#x');
    expect(doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://pedrollobombas.com/categoria/multietapas');
    expect(meta(doc, 'meta[name="description"]')).toBe(clip(DEFAULT_DESCRIPTION));
    expect(meta(doc, 'meta[property="og:url"]')).toBe('https://pedrollobombas.com/categoria/multietapas');
    expect(meta(doc, 'meta[property="og:title"]')).toBe('Título de prueba');
    expect(meta(doc, 'meta[property="og:image"]')).toBe('https://pedrollobombas.com/media/comercial/og-tienda.jpg');
    seo.page('/');
    expect(doc.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://pedrollobombas.com/');
  });

  it('lo que afina una página no lo pisa la navegación que la trajo, pero sí la siguiente', () => {
    const jsonLd = productJsonLd({ path: '/producto/cpm-620', model: 'CPm 620', name: 'Serie CP · Centrífugas', description: 'Bomba </script> rara', image: 'media/x.png', price: 4762.1, inStock: true, seller: 'Bombas y Sistemas Vega' });
    seo.set({ path: '/producto/cpm-620', description: 'Bomba Pedrollo CPm 620.', image: 'media/x.png', type: 'product', jsonLd });
    seo.page('/producto/cpm-620?revision=0');
    expect(meta(doc, 'meta[name="description"]')).toBe('Bomba Pedrollo CPm 620.');
    expect(meta(doc, 'meta[property="og:type"]')).toBe('product');
    expect(meta(doc, 'meta[property="og:image"]')).toBe('https://pedrollobombas.com/media/x.png');
    const ld = doc.head.querySelector('script#ld-pagina')!.textContent!;
    expect(ld).not.toContain('</script>');
    const o = JSON.parse(ld);
    expect(o['@type']).toBe('Product'); expect(o.sku).toBe('CPm 620'); expect(o.brand.name).toBe('Pedrollo');
    expect(o.offers).toMatchObject({ price: '4762.10', priceCurrency: 'MXN', availability: 'https://schema.org/InStock', url: 'https://pedrollobombas.com/producto/cpm-620' });
    seo.page('/contacto');
    expect(meta(doc, 'meta[name="description"]')).toBe(clip(DEFAULT_DESCRIPTION));
    expect(doc.head.querySelector('script#ld-pagina')).toBeNull();
  });

  it('sin precio no se anuncia oferta; sobre pedido no dice «en existencia»; la descripción se corta en palabra', () => {
    const base = { path: '/producto/x', model: 'X', name: 'Serie X', description: 'd', seller: 'BSV' };
    expect(productJsonLd({ ...base, price: null, inStock: false })).not.toHaveProperty('offers');
    expect((productJsonLd({ ...base, price: 10, inStock: false }) as { offers: { availability: string } }).offers.availability).toBe('https://schema.org/BackOrder');
    const largo = clip('palabra '.repeat(60));
    expect(largo.length).toBeLessThanOrEqual(160); expect(largo.endsWith('palabra…')).toBe(true);
  });
});
