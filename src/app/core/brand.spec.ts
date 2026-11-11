import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BRAND, sellerLine, Seller } from './brand';
import { Footer } from '../shared/ui/footer';

/** 11-nov: el nombre legal de quien vende vive en un solo lugar (BRAND.vendedor) y de ahí lo leen el pie y los términos. */
describe('vendedor de la tienda', () => {
  const base: Seller = { nombreComercial: 'Bombas y Sistemas Vega', siglas: 'BSV', razonSocial: 'Nombre De Prueba', figura: 'persona-fisica', rfc: null, domicilio: 'X', pasarela: 'Mercado Pago' };

  it('persona física: se nombra a la persona y el nombre comercial; persona moral: la razón social', () => {
    expect(sellerLine(base)).toBe('Nombre De Prueba, persona física con actividad empresarial que opera con el nombre comercial Bombas y Sistemas Vega (BSV)');
    expect(sellerLine({ ...base, figura: 'persona-moral', razonSocial: 'Bombas y Sistemas Vega, S.A. de C.V.' })).toBe('Bombas y Sistemas Vega, S.A. de C.V. (BSV)');
  });

  it('el pie de página toma vendedor y pasarela de la configuración, sin textos fijos', () => {
    TestBed.configureTestingModule({ imports: [Footer], providers: [provideRouter([]), { provide: BRAND, useValue: { id: 'pedrollo', name: 'Pedrollo', tagline: '', logo: null, logoCompact: null, logoOnDark: null, vendedor: base } }] });
    const f = TestBed.createComponent(Footer); f.detectChanges(); const t = (f.nativeElement as HTMLElement).textContent!;
    expect(t).toContain('© 2026 Bombas y Sistemas Vega · Nombre De Prueba'); expect(t).toContain('Pagos seguros con Mercado Pago');
    expect(t).not.toContain('S.A. de C.V.'); expect(t).not.toContain('Stripe');
  });
});
