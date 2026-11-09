import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StoreBanner } from '../../core/api/storefront-api';
import { ImgSlot } from './img-slot';

function slot(inputs: Record<string, unknown>) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const f = TestBed.createComponent(ImgSlot);
  for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
  f.detectChanges();
  return f.nativeElement as HTMLElement;
}
const B: StoreBanner = { url: '/media/pedrollo/banner/3f9a1c2e7b4d6a80.webp', urlMovil: null, alt: 'Buen Fin en Pedrollo', enlace: null };

describe('bsv-img-slot · banner (bala 11)', () => {
  it('con banner pinta <picture> con url y alt; sin urlMovil no hay <source>', () => {
    const el = slot({ slot: 'hero-home', banner: B });
    expect(el.querySelector('picture')).not.toBeNull();
    expect(el.querySelector('picture source')).toBeNull();
    const img = el.querySelector('img')!;
    expect(img.getAttribute('src')).toBe(B.url); expect(img.getAttribute('alt')).toBe(B.alt);
    expect(el.classList.contains('has-img')).toBe(true);
  });

  it('con urlMovil agrega el <source> de hasta 767 px', () => {
    TestBed.resetTestingModule();
    const el = slot({ slot: 'hero-home', banner: { ...B, urlMovil: '/media/pedrollo/banner/aaaaaaaaaaaaaaaa.webp' } });
    const s = el.querySelector('picture source')!;
    expect(s.getAttribute('media')).toBe('(max-width: 767px)'); expect(s.getAttribute('srcset')).toBe('/media/pedrollo/banner/aaaaaaaaaaaaaaaa.webp');
  });

  it('el enlace: ruta de la tienda va por routerLink; https abre aparte con noopener', () => {
    TestBed.resetTestingModule();
    const interno = slot({ slot: 'hero-home', banner: { ...B, enlace: '/serie/2cp' } });
    expect(interno.querySelector('a')!.getAttribute('href')).toBe('/serie/2cp'); expect(interno.querySelector('a')!.getAttribute('target')).toBeNull();
    TestBed.resetTestingModule();
    const externo = slot({ slot: 'hero-home', banner: { ...B, enlace: 'https://pedrollo.com.mx/promo' } });
    const a = externo.querySelector('a')!;
    expect(a.getAttribute('href')).toBe('https://pedrollo.com.mx/promo'); expect(a.getAttribute('target')).toBe('_blank'); expect(a.getAttribute('rel')).toBe('noopener');
  });

  it('sin banner cae al manifiesto, como siempre (y sin <picture>)', () => {
    TestBed.resetTestingModule();
    const el = slot({ slot: 'hero-home', alt: 'x' });
    expect(el.querySelector('picture')).toBeNull();
    expect(el.querySelector('img')!.getAttribute('src')).toBe('media/comercial/multietapas/2cp/hero.webp');
    TestBed.resetTestingModule();
    expect(slot({ slot: 'hero-home', src: '/otra.webp' }).querySelector('img')!.getAttribute('src')).toBe('/otra.webp');
  });
});
