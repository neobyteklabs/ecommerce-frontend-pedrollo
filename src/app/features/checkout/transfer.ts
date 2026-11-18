import { Component, computed, inject, input, signal, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StorefrontApi, TransferView } from '../../core/api/storefront-api';
import { toBase64 } from '../../core/files';
import { mxn } from '../../core/products';
import { Alert, Icon } from '../../shared/ui';

/** Mismo tope que el backend. */
export const MAX_PROOF_BYTES = 8 * 1024 * 1024;
const PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

/**
 * `/pedido/:folio/transferencia?c=`: el comprador que eligió pagar por transferencia ve los datos bancarios, hasta cuándo está apartado su
 * pedido, y sube su comprobante. Llega desde el checkout o desde el enlace del correo; la segunda llave (su correo) va en `c`, como en el seguimiento.
 * Nada aquí marca el pedido como pagado: eso lo hace una persona desde el portal.
 */
@Component({
  selector: 'bsv-transfer', imports: [RouterLink, Icon, Alert],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Transferencia' },
  template: `
  @if (view(); as v) {
    <div data-component="TransferPayment" style="max-width:860px;margin:0 auto">
      @if (v.pago === 'pagado') {
        <div class="empty confirm-hero" style="max-width:none" data-component="TransferPaid"><div class="icon"><bsv-icon name="check" style="--icon:30px" /></div><h1 style="font-size:var(--text-2xl);margin:0">¡Depósito confirmado!</h1><p>Tu pedido <strong class="mono">{{ v.numero }}</strong> ya está pagado y sigue su curso.</p>
          <div class="row" style="justify-content:center;flex-wrap:wrap"><a class="btn btn-primary btn-lg" [routerLink]="['/seguimiento', v.folio]"><bsv-icon name="truck" style="--icon:20px" /> Seguir mi pedido</a><a class="btn btn-secondary btn-lg" [routerLink]="['/seguimiento', v.folio]" [queryParams]="{ c: c(), factura: 1 }">Solicitar factura</a></div></div>
      } @else if (v.estado !== 'pendiente_pago') {
        <div class="empty" data-component="TransferClosed"><h1 style="font-size:var(--text-2xl)">Este pedido ya no está apartado</h1><p>El plazo para transferir venció y la mercancía se liberó. Si ya habías transferido, escríbenos por <a href="https://wa.me/525610631274">WhatsApp</a> con tu número de pedido <span class="mono">{{ v.numero }}</span> y lo resolvemos.</p><a class="btn btn-primary" routerLink="/catalogo">Volver al catálogo</a></div>
      } @else if (v.pago === null) {
        <div class="empty" data-component="TransferNotChosen"><h1 style="font-size:var(--text-2xl)">Este pedido no se paga por transferencia</h1><p>Regresa al pago para terminarlo con tarjeta.</p><a class="btn btn-primary" routerLink="/checkout" [queryParams]="{ step: 2 }">Ir al pago</a></div>
      } @else {
        <h1 style="font-size:var(--text-2xl);margin:0 0 4px">Paga tu pedido por transferencia</h1>
        <p class="muted" style="margin:0 0 16px">Pedido <strong class="mono">{{ v.numero }}</strong> · apartado hasta el <strong>{{ vence() }}</strong>. Después de esa hora se cancela solo.</p>
        @switch (v.pago) {
          @case ('en_revision') { <bsv-alert kind="success" title="Recibimos tu comprobante" data-component="TransferInReview">Estamos confirmando el depósito con el banco; normalmente tarda unas horas en días hábiles. Te avisamos por correo en cuanto quede.</bsv-alert> }
          @case ('rechazado') { <bsv-alert kind="danger" title="No pudimos confirmar tu depósito" data-component="TransferRejected">{{ v.nota }} Sube otro comprobante cuando lo tengas.</bsv-alert> }
        }
        <div class="grid md-grid-2" style="margin-top:16px;align-items:start">
          <div class="card" data-component="BankData"><h3 style="margin:0 0 12px">1. Transfiere a esta cuenta</h3>
            @if (v.banco; as b) {
              <dl class="bank">
                <dt>Banco</dt><dd>{{ b.banco }}</dd>
                <dt>Titular</dt><dd>{{ b.titular }}</dd>
                <dt>CLABE</dt><dd><span class="mono">{{ b.clabe }}</span> <button class="btn btn-ghost btn-sm" type="button" (click)="copy(b.clabe, 'clabe')">{{ copied() === 'clabe' ? 'Copiada' : 'Copiar' }}</button></dd>
                @if (b.cuenta) { <dt>Cuenta</dt><dd class="mono">{{ b.cuenta }}</dd> }
                <dt>Monto exacto</dt><dd><strong>{{ mxn(v.total) }}</strong> <button class="btn btn-ghost btn-sm" type="button" (click)="copy(v.total.toFixed(2), 'monto')">{{ copied() === 'monto' ? 'Copiado' : 'Copiar' }}</button></dd>
                <dt>Concepto</dt><dd><span class="mono">{{ b.referencia }}</span> <button class="btn btn-ghost btn-sm" type="button" (click)="copy(b.referencia, 'ref')">{{ copied() === 'ref' ? 'Copiado' : 'Copiar' }}</button></dd>
              </dl>
              @if (b.instrucciones) { <p class="small muted" style="margin:12px 0 0;white-space:pre-line">{{ b.instrucciones }}</p> }
              <p class="xs muted" style="margin:12px 0 0">Transfiere el monto exacto y pon tu número de pedido en el concepto: así encontramos tu depósito más rápido. También te mandamos estos datos por correo.</p>
            }
          </div>
          <div class="card" data-component="ProofUpload"><h3 style="margin:0 0 12px">2. Sube tu comprobante</h3>
            @if (v.comprobante; as p) { <p class="small" style="margin:0 0 12px" data-component="ProofCurrent">Último que subiste: <strong>{{ p.nombre }}</strong> · {{ fecha(p.subido) }}@if (v.pago === 'en_revision') { . Si te equivocaste de archivo, puedes subir otro. }</p> }
            <div class="field" [class.has-error]="!!fileError()"><label for="tr-file">Comprobante de la transferencia <span class="muted" style="font-weight:400">(PDF o imagen, hasta 8 MB)</span></label>
              <input id="tr-file" class="input" type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" (change)="pick($event)" />
              <span class="error-msg">{{ fileError() }}</span><span class="hint small muted">El PDF que te da tu banco o una captura de pantalla donde se vea el monto, la fecha y la clave de rastreo.</span></div>
            @if (error()) { <bsv-alert kind="danger" style="margin-top:12px">{{ error() }}</bsv-alert> }
            <button class="btn btn-primary btn-lg btn-block" style="margin-top:16px" type="button" [class.is-loading]="sending()" [disabled]="sending() || !file()" (click)="upload()" data-component="ProofSubmit">{{ sending() ? 'Enviando…' : v.comprobante ? 'Enviar otro comprobante' : 'Enviar comprobante' }}</button>
            <p class="xs muted" style="margin:12px 0 0">¿Todavía no transfieres? No pasa nada: guarda esta página o usa el enlace que te mandamos por correo y sube el comprobante cuando lo tengas.</p>
          </div>
        </div>
      }
    </div>
  } @else if (missing()) {
    <div class="empty"><h1 style="font-size:var(--text-2xl)">No encontramos ese pedido</h1><p>Revisa el enlace de tu correo. Si el problema sigue, escríbenos por <a href="https://wa.me/525610631274">WhatsApp</a>.</p><a class="btn btn-primary" routerLink="/catalogo">Ir al catálogo</a></div>
  } @else if (unavailable()) {
    <div class="empty"><h1 style="font-size:var(--text-2xl)">No pudimos cargar tu pedido</h1><p>La tienda no respondió. Recarga la página en un momento; tu pedido sigue apartado.</p></div>
  } @else { <div class="btn btn-secondary is-loading" style="margin:40px auto;width:160px"></div> }`,
  styles: [`.bank{display:grid;grid-template-columns:auto 1fr;gap:8px 16px;margin:0;font-size:var(--text-sm)} .bank dt{color:var(--color-text-muted)} .bank dd{margin:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-weight:600}`],
})
export class Transfer {
  folio = input(''); c = input('');
  private api = inject(StorefrontApi); mxn = mxn;
  view = signal<TransferView | null>(null); missing = signal(false); unavailable = signal(false);
  file = signal<File | null>(null); fileError = signal<string | null>(null); error = signal<string | null>(null); sending = signal(false); copied = signal<string | null>(null);
  vence = computed(() => this.fecha(this.view()?.vence ?? ''));

  constructor() { afterNextRender(() => void this.load()); }

  private async load() {
    try { this.view.set(await this.api.transferView(this.folio(), this.c())); }
    catch (e) { if ((e as { status?: number }).status === 404) { this.missing.set(true); } else { this.unavailable.set(true); } }
  }

  fecha(iso: string) { const d = new Date(iso); return isNaN(d.getTime()) ? '' : d.toLocaleString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); }

  async copy(text: string, what: string) { try { await navigator.clipboard.writeText(text); this.copied.set(what); setTimeout(() => this.copied.set(null), 2000); } catch { /* sin permiso de portapapeles: el dato sigue a la vista */ } }

  pick(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0] ?? null;
    this.error.set(null); this.fileError.set(this.problem(f)); this.file.set(f && !this.problem(f) ? f : null);
  }
  /** Por qué el archivo no sirve, antes de mandarlo (el backend vuelve a validar el contenido). */
  problem(f: File | null): string | null {
    if (!f) { return null; }
    if (f.size > MAX_PROOF_BYTES) { return 'El archivo pesa más de 8 MB. Sube una captura de pantalla o el PDF de tu banco.'; }
    const name = f.name.toLowerCase();
    return PROOF_TYPES.includes(f.type) || /\.(pdf|jpe?g|png)$/.test(name) ? null : 'El comprobante debe ser un PDF o una imagen JPG o PNG.';
  }

  async upload() {
    const f = this.file(); if (!f || this.sending()) { return; }
    this.sending.set(true); this.error.set(null);
    try {
      this.view.set(await this.api.uploadTransferProof(this.folio(), this.c(), { nombre: f.name, base64: await toBase64(f) }));
      this.file.set(null);
    } catch (err: unknown) {
      const e = err as { status?: number; error?: { message?: string } };
      if (e.status === 400) { this.fileError.set(e.error?.message?.replace(/^comprobante /, 'El comprobante ') ?? 'El archivo no sirve como comprobante.'); }
      else if (e.status === 409) { this.error.set('El plazo de tu pedido venció mientras subías el comprobante.'); void this.load(); }
      else if (e.status === 413) { this.fileError.set('El archivo es demasiado grande. Sube una captura de pantalla o el PDF de tu banco.'); }
      else if (e.status === 404) { this.error.set('No encontramos este pedido con ese contacto.'); }
      else { this.error.set('La tienda no respondió. Intenta de nuevo; tu pedido sigue apartado.'); }
    } finally { this.sending.set(false); }
  }
}
