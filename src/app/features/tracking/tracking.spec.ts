import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TrackingResponse } from '../../core/api/storefront-api';
import { Tracking } from './tracking';

const base: TrackingResponse = { folio: 'F-1', numero: 'PED-000001', tipo: 'pedido', estado: 'preparando', titulo: 'Preparando tu pedido', detalle: 'Ya pedimos tu mercancía.', actualizado: null,
  pedido: { numero: 'PED-000001', total: 1160, moneda: 'MXN', renglones: [{ modelo: '2CP', cantidad: 1 }] }, envios: [], acciones: [] };

async function mostrar(t: Partial<TrackingResponse>) {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(Tracking);
  fixture.componentRef.setInput('folio', 'F-1'); fixture.componentRef.setInput('c', 'ana@example.com');
  fixture.detectChanges(); TestBed.tick();
  http.expectOne(r => r.url === '/api/tienda/v1/seguimiento/F-1' && r.params.get('contacto') === 'ana@example.com').flush({ ...base, ...t });
  await fixture.whenStable(); fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}
const boton = (el: HTMLElement) => el.querySelector('[data-component=InvoiceRequestButton]');
const badge = (el: HTMLElement) => el.querySelector('[data-component=InvoiceBadge]')?.textContent?.trim();

describe('Tracking · solicitar factura', () => {
  it('el botón aparece solo con la acción «factura»', async () => {
    const con = await mostrar({ acciones: ['factura'] });
    expect(boton(con)).not.toBeNull(); expect(con.querySelector('[data-component=Invoice]')!.textContent).toContain('¿Necesitas factura?'); expect(badge(con)).toBeUndefined();
    TestBed.resetTestingModule();
    const sin = await mostrar({ acciones: [] });
    expect(boton(sin)).toBeNull(); expect(sin.querySelector('[data-component=Invoice]')).toBeNull();
  });

  it('una cotización nunca ofrece factura', async () => {
    const el = await mostrar({ tipo: 'cotizacion', numero: 'COT-000001', pedido: null, acciones: ['factura'] });
    expect(el.querySelector('[data-component=Invoice]')).toBeNull();
  });

  it('con factura «rechazada» muestra el badge y vuelve a ofrecer el botón', async () => {
    const el = await mostrar({ acciones: ['factura'], factura: { estado: 'rechazada', creado: '2026-11-05T12:00:00Z', correo: 'conta@aguas.mx' } });
    expect(badge(el)).toBe('Rechazada'); expect(boton(el)).not.toBeNull(); expect(el.textContent).toContain('revisa tu correo');
  });

  it('con factura «facturada» no hay botón y dice a dónde se envió', async () => {
    const el = await mostrar({ acciones: [], factura: { estado: 'facturada', creado: '2026-11-05T12:00:00Z', correo: 'conta@aguas.mx' } });
    expect(badge(el)).toBe('Facturada'); expect(boton(el)).toBeNull(); expect(el.querySelector('[data-component=Invoice]')!.textContent).toContain('conta@aguas.mx');
  });

  it('enviada a contabilidad promete 2 días hábiles; sin_contabilidad no promete plazo', async () => {
    const enviada = await mostrar({ factura: { estado: 'enviada_contabilidad', creado: '2026-11-05T12:00:00Z', correo: 'conta@aguas.mx' } });
    expect(badge(enviada)).toBe('Enviada a contabilidad'); expect(enviada.textContent).toContain('máximo 2 días hábiles'); expect(boton(enviada)).toBeNull();
    TestBed.resetTestingModule();
    const sin = await mostrar({ factura: { estado: 'sin_contabilidad', creado: '2026-11-05T12:00:00Z', correo: 'conta@aguas.mx' } });
    expect(badge(sin)).toBe('Enviada a contabilidad'); expect(sin.textContent).not.toContain('2 días hábiles'); expect(sin.textContent).toContain('te la hacemos llegar a');
  });

  it('el botón abre el modal con el formulario', async () => {
    const el = await mostrar({ acciones: ['factura'] });
    (boton(el) as HTMLButtonElement).click(); TestBed.tick();
    expect(el.querySelector('[data-component=InvoiceModal] bsv-invoice-form')).not.toBeNull();
  });

  it('un clic dentro del modal no queda cancelado: el submit de «Enviar solicitud» sí dispara (regresión del backdrop)', async () => {
    const el = await mostrar({ acciones: ['factura'] });
    (boton(el) as HTMLButtonElement).click();
    await new Promise(r => setTimeout(r, 0));
    const modal = document.querySelector('[data-component=InvoiceModal]') ?? el.querySelector('[data-component=InvoiceModal]');
    expect(modal).not.toBeNull();
    const submit = modal!.querySelector<HTMLButtonElement>('button[type=submit]')!;
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    submit.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
    expect(document.querySelector('[data-component=InvoiceModal]') ?? el.querySelector('[data-component=InvoiceModal]')).not.toBeNull();
  });
});
