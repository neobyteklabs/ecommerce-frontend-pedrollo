import { describe, expect, it, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Confirming } from './confirming';
import { payUrlOf, rememberPayUrl } from './pay-url';
import { StorefrontApi } from '../../core/api/storefront-api';

/** Bala 13: el regreso desde Mercado Pago. Los parámetros de regreso no deciden; decide `confirmar` en el backend. */
describe('Confirmando el pago (regreso de la pasarela)', () => {
  const FOLIO = '11111111-2222-3333-4444-555555555555';
  let respuestas: string[];

  beforeEach(() => {
    sessionStorage.clear(); respuestas = [];
    TestBed.configureTestingModule({
      imports: [Confirming],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: StorefrontApi, useValue: { confirmOrder: async () => ({ folio: FOLIO, numero: 'PED-000001', estado: respuestas.shift() ?? 'pendiente_pago' }) } }],
    });
  });

  function monta() {
    const f = TestBed.createComponent(Confirming); f.componentRef.setInput('folio', FOLIO); f.componentRef.setInput('c', 'a@b.mx'); f.detectChanges();
    return f;
  }

  it('recuerda y lee la URL de pago por folio', () => {
    expect(payUrlOf(FOLIO)).toBeNull();
    rememberPayUrl(FOLIO, 'https://www.mercadopago.com.mx/checkout/v1/redirect?order_id=ORD1');
    expect(payUrlOf(FOLIO)).toContain('order_id=ORD1');
    expect(payUrlOf('otro')).toBeNull();
  });

  it('si el pedido sigue sin pagarse y se creó con Mercado Pago, ofrece volver a pagar ahí', () => {
    rememberPayUrl(FOLIO, 'https://www.mercadopago.com.mx/checkout/v1/redirect?order_id=ORD1');
    const f = monta(); const c = f.componentInstance;
    c.payUrl.set(payUrlOf(FOLIO)); c.state.set('pending'); f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('[data-component="PagoPendiente/MercadoPago"]')).toBeTruthy();
    const volver = Array.from(el.querySelectorAll('a')).find(a => a.textContent!.includes('Volver a Mercado Pago'))!;
    expect(volver.getAttribute('href')).toContain('order_id=ORD1');
    expect(el.textContent).toContain('Volver a revisar');
  });

  it('sin URL de pago recordada (Stripe o simulado) el mensaje pendiente es el de siempre', () => {
    const f = monta(); f.componentInstance.state.set('pending'); f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Tu pago sigue en proceso');
    expect(el.textContent).not.toContain('Mercado Pago');
  });
});
