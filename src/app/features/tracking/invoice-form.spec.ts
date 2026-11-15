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
const llenar = (cmp: InvoiceFormComponent) => Object.assign(cmp.f, { rfc: 'XAXX010101000', razonSocial: 'Aguas del Norte', regimen: '601', cpFiscal: '64000', usoCfdi: 'G03', correo: 'conta@aguas.mx', comentarios: 'Gracias', formaPago: '04' });

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

  it('el POST manda el contacto en la query, los datos fiscales y la forma de pago, con el RFC en mayúsculas; sin constancia no viaja esa llave', async () => {
    const { cmp, http } = setup(); llenar(cmp); cmp.f.rfc = 'xaxx010101000';
    let enviada: unknown; cmp.enviada.subscribe(v => (enviada = v));
    const p = cmp.submit(new Event('submit'));
    const req = http.expectOne(r => r.url === URL);
    expect(req.request.method).toBe('POST'); expect(req.request.params.get('contacto')).toBe('ana@example.com');
    expect(Object.keys(req.request.body as object).sort()).toEqual(['comentarios', 'correo', 'cpFiscal', 'formaPago', 'razonSocial', 'regimen', 'rfc', 'usoCfdi']);
    expect((req.request.body as { formaPago: string }).formaPago).toBe('04');
    expect((req.request.body as { rfc: string }).rfc).toBe('XAXX010101000');
    req.flush({ estado: 'enviada_contabilidad', creado: '2026-11-06T12:00:00Z', yaSolicitada: false }, { status: 201, statusText: 'Created' });
    await p;
    expect(enviada).toEqual({ estado: 'enviada_contabilidad', creado: '2026-11-06T12:00:00Z', yaSolicitada: false, correo: 'conta@aguas.mx' });
    expect(cmp.sending()).toBe(false);
  });

  it('un pedido pagado por transferencia no pregunta la forma de pago: va fija en 03', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(InvoiceFormComponent);
    fixture.componentRef.setInput('folio', 'F-1'); fixture.componentRef.setInput('contacto', 'ana@example.com'); fixture.componentRef.setInput('formasPago', ['03']);
    fixture.detectChanges(); await Promise.resolve(); fixture.detectChanges();
    const cmp = fixture.componentInstance; const el = fixture.nativeElement as HTMLElement; const http = TestBed.inject(HttpTestingController);
    expect(el.querySelector('select#inv-fp')).toBeNull();
    expect(el.querySelector<HTMLInputElement>('input#inv-fp')!.value).toContain('03 · Transferencia');
    llenar(cmp); cmp.f.formaPago = '03';
    const p = cmp.submit(new Event('submit'));
    const req = http.expectOne(r => r.url === URL);
    expect((req.request.body as { formaPago: string }).formaPago).toBe('03');
    req.flush({ estado: 'enviada_contabilidad', creado: '2026-11-06T12:00:00Z', yaSolicitada: false }, { status: 201, statusText: 'Created' });
    await p;
  });

  it('sin forma de pago no hace POST y marca el campo', async () => {
    const { fixture, cmp, el, http } = setup(); llenar(cmp); cmp.f.formaPago = '';
    await cmp.submit(new Event('submit')); fixture.detectChanges();
    http.expectNone(r => r.url.includes('/factura'));
    expect(el.querySelector('#inv-fp')!.closest('.field')!.classList.contains('has-error')).toBe(true);
  });

  it('la constancia viaja en base64 con su nombre; una que no es PDF o pesa más de 4 MB no sale', async () => {
    const { fixture, cmp, el, http } = setup(); llenar(cmp);
    cmp.file.set(new File(['hola'], 'foto.png', { type: 'image/png' }));
    await cmp.submit(new Event('submit')); fixture.detectChanges();
    http.expectNone(r => r.url.includes('/factura'));
    expect(el.querySelector('[data-component="InvoiceCertificate"]')!.textContent).toContain('debe ser un archivo PDF');
    const grande = new File(['x'], 'csf.pdf', { type: 'application/pdf' }); Object.defineProperty(grande, 'size', { value: 4 * 1024 * 1024 + 1 });
    cmp.file.set(grande);
    await cmp.submit(new Event('submit')); fixture.detectChanges();
    http.expectNone(r => r.url.includes('/factura'));
    expect(el.querySelector('[data-component="InvoiceCertificate"]')!.textContent).toContain('4 MB');

    cmp.file.set(new File(['%PDF-1.7 prueba'], 'Constancia AAA.pdf', { type: 'application/pdf' }));
    const p = cmp.submit(new Event('submit'));
    await new Promise(r => setTimeout(r, 50));   // FileReader es asíncrono
    const req = http.expectOne(r => r.url === URL);
    const c = (req.request.body as { constancia: { nombre: string; base64: string } }).constancia;
    expect(c.nombre).toBe('Constancia AAA.pdf'); expect(atob(c.base64)).toBe('%PDF-1.7 prueba');
    req.flush({ estado: 'enviada_contabilidad', creado: '2026-11-06T12:00:00Z', yaSolicitada: false }, { status: 201, statusText: 'Created' });
    await p;
  });

  it('un 413 (archivo demasiado grande para el servidor) se explica en el campo de la constancia', async () => {
    const { fixture, cmp, el, http } = setup(); llenar(cmp);
    const p = cmp.submit(new Event('submit'));
    http.expectOne(r => r.url === URL).flush({ code: 'PAYLOAD_TOO_LARGE' }, { status: 413, statusText: 'Payload Too Large' });
    await p; fixture.detectChanges();
    expect(el.querySelector('[data-component="InvoiceCertificate"]')!.textContent).toContain('demasiado grande');
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
