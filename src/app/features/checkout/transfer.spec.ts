import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { Transfer, MAX_PROOF_BYTES } from './transfer';
import { StorefrontApi, TransferView } from '../../core/api/storefront-api';

const BASE: TransferView = { folio: 'F-1', numero: 'PED-000001', estado: 'pendiente_pago', total: 45369.34, moneda: 'MXN', pago: 'pendiente', nota: null,
  vence: '2026-11-17T18:00:00Z', banco: { banco: 'BBVA', titular: 'Bombas y Sistemas Vega SA de CV', cuenta: null, clabe: '012180001234567895', instrucciones: null, referencia: 'PED-000001' },
  comprobante: null };

async function montar(v: TransferView | { status: number }, api: Partial<StorefrontApi> = {}) {
  const transferView = vi.fn(() => 'status' in v ? Promise.reject(v) : Promise.resolve(v));
  TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: StorefrontApi, useValue: { transferView, ...api } }] });
  const f = TestBed.createComponent(Transfer);
  f.componentRef.setInput('folio', 'F-1'); f.componentRef.setInput('c', 'ana@example.com');
  f.detectChanges(); await f.whenStable(); await Promise.resolve(); f.detectChanges();
  return { f, el: f.nativeElement as HTMLElement, cmp: f.componentInstance, transferView };
}
const q = (el: HTMLElement, c: string) => el.querySelector<HTMLElement>(`[data-component="${c}"]`);

describe('Pago por transferencia (página del comprador)', () => {
  it('pendiente: muestra los datos bancarios, el monto exacto y el número de pedido como concepto; sin archivo no se puede enviar', async () => {
    const { el, transferView } = await montar(BASE);
    expect(transferView).toHaveBeenCalledWith('F-1', 'ana@example.com');
    const banco = q(el, 'BankData')!.textContent!;
    expect(banco).toContain('BBVA'); expect(banco).toContain('012180001234567895'); expect(banco).toContain('PED-000001'); expect(banco).toContain('45,369.34');
    expect((q(el, 'ProofSubmit') as HTMLButtonElement).disabled).toBe(true);
    expect(q(el, 'TransferInReview')).toBeNull(); expect(q(el, 'TransferRejected')).toBeNull();
  });

  it('un archivo que no es PDF ni imagen, o de más de 8 MB, se rechaza antes de mandarlo', async () => {
    const { cmp } = await montar(BASE);
    expect(cmp.problem(new File(['x'], 'estado.docx', { type: 'application/msword' }))).toContain('PDF o una imagen');
    const grande = new File(['x'], 'spei.pdf', { type: 'application/pdf' }); Object.defineProperty(grande, 'size', { value: MAX_PROOF_BYTES + 1 });
    expect(cmp.problem(grande)).toContain('8 MB');
    expect(cmp.problem(new File(['x'], 'captura.JPG', { type: '' }))).toBeNull();
  });

  it('subir el comprobante lo manda en base64 con su nombre y la página pasa a «en revisión»', async () => {
    const revisado: TransferView = { ...BASE, pago: 'en_revision', comprobante: { nombre: 'spei.pdf', tipo: 'application/pdf', subido: '2026-11-15T20:00:00Z', total: 1 } };
    const uploadTransferProof = vi.fn(() => Promise.resolve(revisado));
    const { f, el, cmp } = await montar(BASE, { uploadTransferProof });
    cmp.file.set(new File(['%PDF-1.7 spei'], 'spei.pdf', { type: 'application/pdf' }));
    await cmp.upload(); f.detectChanges();
    expect(uploadTransferProof).toHaveBeenCalledWith('F-1', 'ana@example.com', { nombre: 'spei.pdf', base64: btoa('%PDF-1.7 spei') });
    expect(q(el, 'TransferInReview')!.textContent).toContain('Recibimos tu comprobante');
    expect(q(el, 'ProofCurrent')!.textContent).toContain('spei.pdf');
    expect(q(el, 'ProofSubmit')!.textContent).toContain('Enviar otro comprobante');
  });

  it('un 400 del servidor explica por qué el archivo no sirve; un 409 avisa que el plazo venció', async () => {
    const uploadTransferProof = vi.fn()
      .mockRejectedValueOnce({ status: 400, error: { message: 'comprobante debe ser un PDF o una imagen JPG o PNG' } })
      .mockRejectedValueOnce({ status: 409, error: { message: 'El pedido ya no está abierto' } });
    const { f, el, cmp } = await montar(BASE, { uploadTransferProof });
    cmp.file.set(new File(['x'], 'spei.pdf', { type: 'application/pdf' }));
    await cmp.upload(); f.detectChanges();
    expect(q(el, 'ProofUpload')!.textContent).toContain('El comprobante debe ser un PDF o una imagen JPG o PNG');
    await cmp.upload(); f.detectChanges();
    expect(q(el, 'ProofUpload')!.textContent).toContain('venció');
  });

  it('rechazado: muestra la nota de quien revisó y deja subir otro', async () => {
    const { el } = await montar({ ...BASE, pago: 'rechazado', nota: 'El depósito no aparece en la cuenta.', comprobante: { nombre: 'a.pdf', tipo: 'application/pdf', subido: '2026-11-15T20:00:00Z', total: 1 } });
    expect(q(el, 'TransferRejected')!.textContent).toContain('El depósito no aparece en la cuenta.');
    expect(q(el, 'ProofSubmit')).not.toBeNull();
  });

  it('pagado: ya no enseña los datos bancarios y ofrece seguir el pedido y pedir la factura', async () => {
    const { el } = await montar({ ...BASE, estado: 'pagado', pago: 'pagado', banco: null, vence: null });
    expect(q(el, 'TransferPaid')!.textContent).toContain('Depósito confirmado');
    expect(q(el, 'BankData')).toBeNull();
    expect(el.querySelector('a[href*="factura=1"]')).not.toBeNull();
  });

  it('vencido, sin transferencia elegida o con folio/contacto que no casan: cada caso con su mensaje y sin formulario', async () => {
    const a = await montar({ ...BASE, estado: 'expirado', banco: null, vence: null });
    expect(q(a.el, 'TransferClosed')!.textContent).toContain('ya no está apartado'); expect(q(a.el, 'ProofUpload')).toBeNull();
    TestBed.resetTestingModule();
    const b = await montar({ ...BASE, pago: null, banco: null });
    expect(q(b.el, 'TransferNotChosen')).not.toBeNull();
    TestBed.resetTestingModule();
    const c = await montar({ status: 404 });
    expect(c.el.textContent).toContain('No encontramos ese pedido');
  });
});
