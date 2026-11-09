import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { StorefrontProduct } from '../../core/api/storefront-api';
import { ProductPage } from './product';

(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} };

const PAGE = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 8 };
type Remoto = Partial<StorefrontProduct>;
const img = (n: string, seccion: 'foto' | 'curvas' | 'componentes' | 'ficha', alt = '') => ({ url: `/media/pedrollo/producto/${n.repeat(16)}.webp`, alt, seccion });

export async function ficha(remoto: Remoto) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
  const http = TestBed.inject(HttpTestingController);
  const f = TestBed.createComponent(ProductPage);
  f.componentRef.setInput('id', '2cp-32-210a');
  f.detectChanges(); TestBed.tick();
  http.match(r => r.url === '/api/tienda/v1/productos/2cp-32-210a').forEach(r => r.flush({ slug: '2cp-32-210a', model: '2CP 32/210A', imageKey: null, fichaKey: null, price: null, availability: null, imagenes: [], documentos: [], ...remoto }));
  http.match(() => true).forEach(r => r.flush(PAGE));
  await f.whenStable(); f.detectChanges();
  return { el: f.nativeElement as HTMLElement, f };
}
const tabs = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLButtonElement>('[data-component=GalleryTabs] button'));
async function abrir(f: { detectChanges(): void; whenStable(): Promise<unknown> }, el: HTMLElement, nombre: string) {
  tabs(el).find(b => b.textContent!.includes(nombre))!.click(); f.detectChanges(); await f.whenStable(); f.detectChanges();
}
const principal = (el: HTMLElement) => el.querySelector('[data-component=Gallery] img')?.getAttribute('src');

describe('Ficha · imágenes por sección (bala 12)', () => {
  it('una imagen por sección cae en su pestaña, y la pestaña se habilita', async () => {
    const { el, f } = await ficha({ imagenes: [img('a', 'foto', 'Frente'), img('b', 'curvas'), img('c', 'componentes'), img('d', 'ficha')] });
    expect(principal(el)).toBe(img('a', 'foto').url);
    for (const [nombre, k] of [['Curvas de rendimiento', 'b'], ['Componentes', 'c'], ['Ficha técnica', 'd']] as const) {
      await abrir(f, el, nombre);
      expect(principal(el), nombre).toBe(img(k, 'foto').url);
      expect(el.querySelector('[data-component=Gallery] p')!.textContent).toContain('Imagen de tienda');
    }
    await abrir(f, el, 'Fotografía');
    expect(el.querySelectorAll('.thumbs img').length).toBeGreaterThan(0);
    expect(Array.from(el.querySelectorAll('.thumbs img')).map(i => i.getAttribute('src'))).not.toContain(img('b', 'curvas').url);
  });

  it('con una imagen de tienda en foto ya no se pinta el mosaico «fotografía original pendiente»', async () => {
    const con = await ficha({ imagenes: [img('a', 'foto')] });
    expect(con.el.innerHTML).not.toContain('fotografía original del modelo');
    const sin = await ficha({ imagenes: [img('b', 'curvas')] });
    expect(sin.el.innerHTML).toContain('fotografía original del modelo');   // una imagen de curvas no es fotografía del modelo
    const nada = await ficha({});
    expect(nada.el.innerHTML).toContain('fotografía original del modelo');
  });

  it('el orden relativo dentro de la sección es el del admin', async () => {
    const { el, f } = await ficha({ imagenes: [img('a', 'curvas'), img('b', 'foto'), img('c', 'curvas')] });
    await abrir(f, el, 'Curvas de rendimiento');
    const t = Array.from(el.querySelectorAll('.thumbs img')).map(i => i.getAttribute('src'));
    expect(t.slice(0, 2)).toEqual([img('a', 'curvas').url, img('c', 'curvas').url]);
  });
});
