import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CartService } from '../../core/cart';
import { ProductService } from '../../core/products';
import { cardFromProduct } from '../../core/api/storefront-view';
import { ProductCard } from '../../shared/ui';
import { Cart } from './cart';

(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} };

const ID = '2cp-32-210a';
function carrito(imagen: string | null) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
  TestBed.inject(CartService).lines.set([{ id: ID, qty: 1, priceAtAdd: 1000, ...(imagen ? { imagen } : {}) }]);
  const f = TestBed.createComponent(Cart);
  f.detectChanges(); TestBed.tick(); f.detectChanges();
  return f.nativeElement as HTMLElement;
}

describe('Carrito y tarjetas · imagen (bala 12)', () => {
  it('la línea del carrito pinta la imagen de tienda guardada al agregar', () => {
    const el = carrito('/media/pedrollo/producto/aaaaaaaaaaaaaaaa.webp');
    expect(el.querySelector('[data-component=CartLine] img')!.getAttribute('src')).toBe('/media/pedrollo/producto/aaaaaaaaaaaaaaaa.webp');
  });

  it('sin imagen de tienda usa la foto técnica del modelo (no el recuadro con el slug)', () => {
    const el = carrito(null);
    const p = TestBed.inject(ProductService).byId(ID)!;
    expect(p.catalog).toBeTruthy();
    expect(el.querySelector('[data-component=CartLine] img')!.getAttribute('src')).toBe(p.catalog);
  });

  it('CartService.add guarda la imagen de tienda en la línea (y una segunda alta no la pierde)', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    const cart = TestBed.inject(CartService); cart.lines.set([]);
    cart.add(ID, 1, 1000, '/media/pedrollo/producto/bbbbbbbbbbbbbbbb.webp');
    cart.add(ID, 1, 1000);
    expect(cart.lines()).toHaveLength(1);
    expect(cart.lines()[0].qty).toBe(2); expect(cart.lines()[0].imagen).toBe('/media/pedrollo/producto/bbbbbbbbbbbbbbbb.webp');
  });

  it('la tarjeta (listado y buscador usan la misma) pinta `imagen` antes que la foto técnica', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const base = cardFromProduct(TestBed.runInInjectionContext(() => TestBed.inject(ProductService)).byId(ID)!);
    const pinta = (imagen: string | null) => {
      const f = TestBed.createComponent(ProductCard); f.componentRef.setInput('p', { ...base, imagen }); f.detectChanges();
      return (f.nativeElement as HTMLElement).querySelector('img')!.getAttribute('src');
    };
    expect(pinta('/media/pedrollo/producto/cccccccccccccccc.webp')).toBe('/media/pedrollo/producto/cccccccccccccccc.webp');
    expect(pinta(null)).toBe(base.catalog);
  });
});
