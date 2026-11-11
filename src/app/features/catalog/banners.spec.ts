import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { StoreBanners } from '../../core/api/storefront-api';
import { Home } from './home';

// jsdom no trae IntersectionObserver (lo usa la animación de entrada): un doble inerte basta.
(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} };

const VACIOS: StoreBanners = { hero: [], franja: [], 'banner-marca': [], categoria: {} };
const b = (url: string, alt: string, enlace: string | null = null) => ({ url, urlMovil: null, alt, enlace });
const PAGE = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 8 };

async function home(banners: StoreBanners) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
  const http = TestBed.inject(HttpTestingController);
  const f = TestBed.createComponent(Home);
  f.detectChanges(); TestBed.tick();
  http.expectOne(r => r.url === '/api/tienda/v1/banners').flush(banners);
  http.match(r => r.url === '/api/tienda/v1/productos').forEach(r => r.flush(PAGE));
  await f.whenStable(); f.detectChanges();
  return f.nativeElement as HTMLElement;
}
const q = (el: HTMLElement, sel: string) => el.querySelector(sel);

describe('Home · banners (bala 11)', () => {
  it('con banners vacíos la home es la de siempre: manifiesto en hero y marca, sin Franja', async () => {
    const el = await home(VACIOS);
    expect(q(el, '[data-component=Hero] img')!.getAttribute('src')).toBe('media/comercial/multietapas/2cp/hero.webp');
    expect(q(el, '[data-component=Hero] picture')).toBeNull();
    expect(q(el, '[data-component="Section/Franja"]')).toBeNull();
    const marca = q(el, '[data-component="Section/BannerMarca"]')!;
    expect(marca.querySelector('a')!.getAttribute('href')).toBe('/serie/2cp');
    expect(marca.querySelector('img')!.getAttribute('src')).toBe('media/comercial/multietapas/2cp/banner.webp');
    expect(marca.querySelector('img')!.getAttribute('alt')).toContain('Pedrollo 2CP');
  });

  it('con un hero vigente se pinta su url y alt, y el texto del hero no cambia', async () => {
    const el = await home({ ...VACIOS, hero: [b('/media/pedrollo/banner/1111111111111111.webp', 'Buen Fin hero', '/categoria/multietapas')] });
    const img = q(el, '[data-component=Hero] img')!;
    expect(img.getAttribute('src')).toBe('/media/pedrollo/banner/1111111111111111.webp'); expect(img.getAttribute('alt')).toBe('Buen Fin hero');
    expect(q(el, '[data-component=Hero] a.banner-link')!.getAttribute('href')).toBe('/categoria/multietapas');
    expect(q(el, '[data-component=Hero] h1')!.textContent).toContain('Dos rodetes');
    expect(q(el, '[data-component="Section/Franja"]')).toBeNull();
  });

  it('con una franja aparece Section/Franja entre el hero y las categorías', async () => {
    const el = await home({ ...VACIOS, franja: [b('/media/pedrollo/banner/2222222222222222.webp', 'Toda la tienda en descuento')] });
    const franja = q(el, '[data-component="Section/Franja"]')!;
    expect(franja.querySelector('img')!.getAttribute('alt')).toBe('Toda la tienda en descuento');
    expect(franja.previousElementSibling!.getAttribute('data-component')).toBe('Hero');
    // 11-nov: entre la franja y las categorías va el riel de series (la franja sigue pegada al hero).
    expect(franja.nextElementSibling!.getAttribute('data-component')).toBe('Section/Series');
    expect(franja.nextElementSibling!.nextElementSibling!.getAttribute('data-component')).toBe('Section/Categorias');
  });

  it('el banner de marca sustituye la imagen y, sin enlace propio, va a /serie/2cp', async () => {
    const el = await home({ ...VACIOS, 'banner-marca': [b('/media/pedrollo/banner/3333333333333333.webp', 'Marca nueva')] });
    const marca = q(el, '[data-component="Section/BannerMarca"]')!;
    expect(marca.querySelector('img')!.getAttribute('src')).toBe('/media/pedrollo/banner/3333333333333333.webp');
    expect(marca.querySelector('a')!.getAttribute('href')).toBe('/serie/2cp');
  });
});
