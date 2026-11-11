import { describe, expect, it } from 'vitest';
import { productFromApi } from './storefront-view';
import { PRODUCTS } from '../products';
import { StorefrontProduct } from './storefront-api';

/** 11-nov: un producto publicado que el manifiesto local no conoce tiene ficha igual (antes: «Producto no encontrado»). */
describe('productFromApi', () => {
  const api = {
    slug: 'mc-40-65-4', catalogProductId: 20998, model: 'MC 40/65-4', family: 'SUMERGIBLES PARA DRENAJE', subtype: 'MC SUMERGIBLES BICANAL', series: 'MC',
    supplier: { id: 9, slug: 'pedrollo' }, price: null, availability: null, attributes: { hp: '5.5', voltaje: '220/440' }, sectionNote: null, description: null,
    imageKey: null, fichaKey: null, imagenes: [], documentos: [],
  } as unknown as StorefrontProduct;

  it('el caso reportado no está en el manifiesto local', () => {
    expect(PRODUCTS.find(p => p.id === 'mc-40-65-4')).toBeUndefined();
  });

  it('arma la ficha con serie, familia y datos de la lista, sin darlos por validados', () => {
    const p = productFromApi(api);
    expect(p.id).toBe('mc-40-65-4'); expect(p.model).toBe('MC 40/65-4');
    expect(p.serie).toBe('mc'); expect(p.family).toBe('sumergibles-para-drenaje'); expect(p.name).toContain('Serie MC');
    expect(p.hp).toBe(5.5); expect(p.voltages).toEqual(['220', '440']);
    expect(p.validated).toBe(false); expect(p.catalogIsSeriesPhoto).toBe(true); expect(p.enCrm).toBe(true);
  });

  it('tolera un producto sin serie ni atributos', () => {
    const p = productFromApi({ ...api, series: null, attributes: {} } as unknown as StorefrontProduct);
    expect(p.serie).toBe(''); expect(p.hp).toBeNull(); expect(p.voltages).toEqual([]);
  });
});
