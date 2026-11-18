import { feedItem, feedItems, feedXml, FeedProduct } from './merchant-feed';

const O = 'https://pedrollobombas.com';
const foto = (s: string) => s === 'pk' ? 'media/tecnico/pk.png' : null;
const base: FeedProduct = { slug: 'pkm-60-md', model: 'PKm 60-MD', family: 'PERIFÉRICAS', familySlug: 'perifericas', series: 'PK', seriesSlug: 'pk', hp: '0.5',
  imagen: null, price: { amount: 2499.5, currency: 'MXN' }, availability: { state: 'carrito' } };

describe('catálogo para Merchant Center', () => {
  it('un producto comprable sale con título, precio, enlace y la foto de su serie', () => {
    expect(feedItem(O, base, foto)).toEqual(jasmineLike({ id: 'pkm-60-md', mpn: 'PKm 60-MD', title: 'Bomba Pedrollo PKm 60-MD 0.5 HP · Periféricas', price: '2499.50 MXN',
      link: O + '/producto/pkm-60-md', image: O + '/media/tecnico/pk.png', type: 'Periféricas' }));
  });

  it('la imagen de tienda gana a la de la serie y una absoluta se respeta', () => {
    expect(feedItem(O, { ...base, imagen: '/media/pedrollo/a.webp' }, foto)!.image).toBe(O + '/media/pedrollo/a.webp');
    expect(feedItem(O, { ...base, imagen: 'https://cdn.x/a.webp' }, foto)!.image).toBe('https://cdn.x/a.webp');
  });

  it('sin potencia no se le llama bomba', () => {
    expect(feedItem(O, { ...base, hp: null, model: 'MR 24', family: 'TANQUES PRECARGADOS' }, foto)!.title).toBe('Pedrollo MR 24 · Tanques precargados');
  });

  it('no se anuncia lo que es a cotizar, lo que no tiene precio o lo que no tiene foto', () => {
    expect(feedItem(O, { ...base, availability: { state: 'cotizar' } }, foto)).toBeNull();
    expect(feedItem(O, { ...base, price: null }, foto)).toBeNull();
    expect(feedItem(O, { ...base, seriesSlug: 'otra' }, foto)).toBeNull();
    expect(feedItem(O, { ...base, slug: '../x' }, foto)).toBeNull();
  });

  it('recorre las páginas, sin repetidos, y escapa el XML', async () => {
    const pages = [[base, { ...base, slug: 'a&b', model: 'A<B' }], [base, { ...base, slug: 'cpm-620', model: 'CPm 620 & Co' }]];
    const items = await feedItems(O, async n => ({ content: pages[n], totalPages: 2 }), foto);
    expect(items.map(i => i.id)).toEqual(['cpm-620', 'pkm-60-md']);
    const xml = feedXml(O, items);
    expect(xml).toContain('<g:mpn>CPm 620 &amp; Co</g:mpn>');
    expect(xml).toContain('<g:price>2499.50 MXN</g:price>');
    expect(xml.match(/<item>/g)!.length).toBe(2);
  });
});

function jasmineLike(o: object) { return expect.objectContaining(o); }
