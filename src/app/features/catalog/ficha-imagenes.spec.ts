import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { StorefrontProduct, StoreImage } from '../../core/api/storefront-api';
import { ProductPage } from './product';

// jsdom no trae IntersectionObserver (lo usa la animación de entrada): un doble inerte basta.
(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} };

const PAGE = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 8 };

describe('Ficha · imágenes de tienda (bala 11)', () => {
  const remoto = (imagenes: StoreImage[]): Partial<StorefrontProduct> => ({ slug: '2cp-32-210a', model: '2CP 32/210A', imageKey: null, fichaKey: null, price: null, availability: null, imagenes });

  async function ficha(imagenes: StoreImage[]) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    const http = TestBed.inject(HttpTestingController);
    const f = TestBed.createComponent(ProductPage);
    f.componentRef.setInput('id', '2cp-32-210a');
    f.detectChanges(); TestBed.tick();
    http.match(r => r.url === '/api/tienda/v1/productos/2cp-32-210a').forEach(r => r.flush(remoto(imagenes)));
    http.match(() => true).forEach(r => r.flush(PAGE));
    await f.whenStable(); f.detectChanges();
    return f.nativeElement as HTMLElement;
  }

  it('con imagenes [a, b] la galería arranca en a y la foto referencial queda después', async () => {
    const el = await ficha([{ url: '/media/pedrollo/producto/aaaaaaaaaaaaaaaa.webp', alt: 'Vista frontal', seccion: 'foto' }, { url: '/media/pedrollo/producto/bbbbbbbbbbbbbbbb.webp', alt: '', seccion: 'foto' }]);
    const main = el.querySelector('[data-component=Gallery] img')!;
    expect(main.getAttribute('src')).toBe('/media/pedrollo/producto/aaaaaaaaaaaaaaaa.webp'); expect(main.getAttribute('alt')).toBe('Vista frontal');
    const thumbs = Array.from(el.querySelectorAll('.thumbs img')).map(i => i.getAttribute('src'));
    expect(thumbs.slice(0, 2)).toEqual(['/media/pedrollo/producto/aaaaaaaaaaaaaaaa.webp', '/media/pedrollo/producto/bbbbbbbbbbbbbbbb.webp']);
    expect(thumbs.length).toBeGreaterThan(2);
    expect(el.querySelectorAll('.thumbs .img-slot')[1].getAttribute('aria-label')).toBe('Imagen de tienda');
    expect(el.querySelector('[data-component=Gallery] p')!.textContent).toContain('Imagen de tienda');
  });

  it('con imagenes [] la galería es la de hoy (sin imágenes de tienda)', async () => {
    const el = await ficha([]);
    const srcs = Array.from(el.querySelectorAll('[data-component=Gallery] img')).map(i => i.getAttribute('src') ?? '');
    expect(srcs.some(s => s.startsWith('/media/'))).toBe(false);
  });
});
