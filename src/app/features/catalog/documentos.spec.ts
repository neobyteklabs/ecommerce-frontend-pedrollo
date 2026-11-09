import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { StoreDocument } from '../../core/api/storefront-api';
import { ProductPage, pesoLegible } from './product';

(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} };

const d = (n: string, tipo: StoreDocument['tipo'], titulo: string, bytes = 1500000): StoreDocument => ({ url: `/media/pedrollo/documento/${n.repeat(16)}.pdf`, tipo, titulo, bytes });
const DOCS = [d('a', 'ficha-tecnica', 'Ficha técnica 60 Hz'), d('b', 'curvas', 'Curvas de rendimiento'), d('c', 'despiece', 'Despiece'), d('d', 'manual', 'Manual de instalación', 800000), d('e', 'certificado', 'Certificado'), d('f', 'otro', 'Otro')];

async function ficha(documentos: StoreDocument[]) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
  const http = TestBed.inject(HttpTestingController);
  const f = TestBed.createComponent(ProductPage);
  f.componentRef.setInput('id', '2cp-32-210a');
  f.detectChanges(); TestBed.tick();
  http.match(r => r.url === '/api/tienda/v1/productos/2cp-32-210a').forEach(r => r.flush({ slug: '2cp-32-210a', model: '2CP 32/210A', imageKey: null, fichaKey: null, price: null, availability: null, imagenes: [], documentos }));
  http.match(() => true).forEach(r => r.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 8 }));
  await f.whenStable(); f.detectChanges();
  return { el: f.nativeElement as HTMLElement, f };
}
async function abrir(f: { detectChanges(): void; whenStable(): Promise<unknown> }, el: HTMLElement, nombre: string) {
  Array.from(el.querySelectorAll<HTMLButtonElement>('[data-component=GalleryTabs] button')).find(b => b.textContent!.includes(nombre))!.click();
  f.detectChanges(); await f.whenStable(); f.detectChanges();
}
const titulos = (el: HTMLElement) => Array.from(el.querySelectorAll('[data-component=Documentos] li strong')).map(x => x.textContent!.trim());

describe('Ficha · documentos PDF (bala 12)', () => {
  it('cada documento aparece solo en su pestaña (curvas, despiece→componentes, el resto→ficha técnica)', async () => {
    const { el, f } = await ficha(DOCS);
    expect(el.querySelector('[data-component=Documentos]')).toBeNull();            // «Fotografía» no lleva documentos
    await abrir(f, el, 'Curvas de rendimiento'); expect(titulos(el)).toEqual(['Curvas de rendimiento']);
    await abrir(f, el, 'Componentes'); expect(titulos(el)).toEqual(['Despiece']);
    await abrir(f, el, 'Ficha técnica'); expect(titulos(el)).toEqual(['Ficha técnica 60 Hz', 'Manual de instalación', 'Certificado', 'Otro']);
  });

  it('cada fila trae título, peso legible, «Ver» y «Descargar»; Ver abre el modal de PDF con esa url y Cerrar lo quita', async () => {
    const { el, f } = await ficha(DOCS);
    await abrir(f, el, 'Ficha técnica');
    const fila = el.querySelectorAll('[data-component=Documentos] li')[1];
    expect(fila.textContent).toContain('Manual de instalación'); expect(fila.textContent).toContain('PDF · 781 KB');
    const bajar = fila.querySelector('a')!; expect(bajar.getAttribute('href')).toBe(DOCS[3].url); expect(bajar.hasAttribute('download')).toBe(true);
    expect(el.querySelector('[data-component=PdfModal]')).toBeNull();
    (fila.querySelector('button') as HTMLButtonElement).click(); f.detectChanges();
    const modal = el.querySelector('[data-component=PdfModal]')!; expect(modal).not.toBeNull();
    expect(modal.querySelector('iframe')!.getAttribute('src')).toBe(DOCS[3].url); expect(modal.textContent).toContain('Manual de instalación');
    expect(modal.querySelector('a[download]')!.getAttribute('href')).toBe(DOCS[3].url);
    Array.from(modal.querySelectorAll('button')).find(b => b.textContent!.includes('Cerrar'))!.click(); f.detectChanges();
    expect(el.querySelector('[data-component=PdfModal]')).toBeNull();
  });

  it('sin documentos no se pinta nada, en ninguna pestaña', async () => {
    const { el, f } = await ficha([]);
    for (const n of ['Fotografía', 'Curvas de rendimiento', 'Componentes', 'Ficha técnica']) { await abrir(f, el, n); expect(el.querySelector('[data-component=Documentos]'), n).toBeNull(); }
  });

  it('el peso se muestra en KB hasta 1 MB y en MB después', () => {
    expect(pesoLegible(500)).toBe('1 KB'); expect(pesoLegible(850 * 1024)).toBe('850 KB'); expect(pesoLegible(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});
