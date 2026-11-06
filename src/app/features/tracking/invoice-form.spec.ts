import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InvoiceFormComponent } from './invoice-form';

const URL = '/api/tienda/v1/seguimiento/F-1/factura';

function setup(contacto = 'ana@example.com') {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  const fixture = TestBed.createComponent(InvoiceFormComponent);
  fixture.componentRef.setInput('folio', 'F-1'); fixture.componentRef.setInput('contacto', contacto); fixture.componentRef.setInput('numero', 'PED-000001');
  fixture.detectChanges();
  return { fixture, cmp: fixture.componentInstance, el: fixture.nativeElement as HTMLElement, http: TestBed.inject(HttpTestingController) };
}
const llenar = (cmp: InvoiceFormComponent) => Object.assign(cmp.f, { rfc: 'XAXX010101000', razonSocial: 'Aguas del Norte', regimen: '601', cpFiscal: '64000', usoCfdi: 'G03', correo: 'conta@aguas.mx', comentarios: 'Gracias' });

describe('InvoiceFormComponent', () => {
  it('el RFC se vuelve mayúsculas mientras se escribe', () => {
    const { fixture, cmp, el } = setup();
    const rfc = el.querySelector<HTMLInputElement>('#inv-rfc')!;
    rfc.value = 'xaxx010101abc'; rfc.dispatchEvent(new Event('input')); fixture.detectChanges();
    expect(rfc.value).toBe('XAXX010101ABC'); expect(cmp.f.rfc).toBe('XAXX010101ABC'); expect(rfc.maxLength).toBe(13);
  });

  it('precarga el correo con el contacto solo si trae @', async () => {
    const a = setup('ana@example.com'); await Promise.resolve(); expect(a.cmp.f.correo).toBe('ana@example.com');
    TestBed.resetTestingModule();
    const b = setup('5512345678'); await Promise.resolve(); expect(b.cmp.f.correo).toBe('');
  });

  it('con RFC y CP inválidos no hace POST y marca los campos', async () => {
    const { fixture, cmp, el, http } = setup();
    llenar(cmp); cmp.f.rfc = 'ABC'; cmp.f.cpFiscal = '640';
    await cmp.submit(new Event('submit')); fixture.detectChanges();
    http.expectNone(r => r.url.includes('/factura'));
    const malos = [...el.querySelectorAll('.field.has-error')].map(x => x.querySelector('input')?.id);
    expect(malos).toEqual(['inv-rfc', 'inv-cp']);
    expect(el.querySelector('.field.has-error .error-msg')!.textContent).toContain('RFC');
  });

  it('el POST manda el contacto en la query y las 7 llaves del cuerpo, con el RFC en mayúsculas', async () => {
    const { cmp, http } = setup(); llenar(cmp); cmp.f.rfc = 'xaxx010101000';
    let enviada: unknown; cmp.enviada.subscribe(v => (enviada = v));
    const p = cmp.submit(new Event('submit'));
    const req = http.expectOne(r => r.url === URL);
    expect(req.request.method).toBe('POST'); expect(req.request.params.get('contacto')).toBe('ana@example.com');
    expect(Object.keys(req.request.body as object).sort()).toEqual(['comentarios', 'correo', 'cpFiscal', 'razonSocial', 'regimen', 'rfc', 'usoCfdi']);
    expect((req.request.body as { rfc: string }).rfc).toBe('XAXX010101000');
    req.flush({ estado: 'enviada_contabilidad', creado: '2026-11-06T12:00:00Z', yaSolicitada: false }, { status: 201, statusText: 'Created' });
    await p;
    expect(enviada).toEqual({ estado: 'enviada_contabilidad', creado: '2026-11-06T12:00:00Z', yaSolicitada: false, correo: 'conta@aguas.mx' });
    expect(cmp.sending()).toBe(false);
  });

  it('un 400 «cpFiscal …» marca el campo del código postal y muestra el mensaje', async () => {
    const { fixture, cmp, el, http } = setup(); llenar(cmp);
    const p = cmp.submit(new Event('submit'));
    http.expectOne(r => r.url === URL).flush({ code: 'VALIDATION_ERROR', message: 'cpFiscal debe ser un código postal de 5 dígitos' }, { status: 400, statusText: 'Bad Request' });
    await p; fixture.detectChanges();
    const malo = el.querySelector('.field.has-error')!;
    expect(malo.querySelector('input')!.id).toBe('inv-cp'); expect(malo.querySelector('.error-msg')!.textContent).toBe('cpFiscal debe ser un código postal de 5 dígitos');
  });

  it('409, 404 y fallo de red muestran su mensaje y devuelven el botón', async () => {
    const { fixture, cmp, el, http } = setup(); llenar(cmp);
    for (const [status, body, texto] of [[409, { message: 'La factura se pide de un pedido pagado.' }, 'La factura se pide de un pedido pagado.'], [404, {}, 'No encontramos este pedido con ese contacto.'], [0, null, 'La tienda no respondió. Intenta de nuevo.']] as const) {
      const p = cmp.submit(new Event('submit'));
      const req = http.expectOne(r => r.url === URL);
      if (status === 0) { req.error(new ProgressEvent('error')); } else { req.flush(body, { status, statusText: 'x' }); }
      await p; fixture.detectChanges();
      expect(el.textContent).toContain(texto);
      expect((el.querySelector('button[type=submit]') as HTMLButtonElement).disabled).toBe(false);
    }
  });
});
