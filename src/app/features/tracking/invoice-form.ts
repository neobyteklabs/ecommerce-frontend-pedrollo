import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorefrontApi, InvoiceRequested } from '../../core/api/storefront-api';
import { mxn } from '../../core/products';
import { Alert, Icon } from '../../shared/ui';
import { REGIMENES, USOS_CFDI } from './invoice-catalogs';

/** Mismo patrón que `InvoiceCatalogs` del backend (RFC en mayúsculas, 12 o 13 caracteres). */
export const RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
type Field = 'rfc' | 'razonSocial' | 'regimen' | 'cpFiscal' | 'usoCfdi' | 'correo' | 'comentarios';
const FIELDS: readonly Field[] = ['rfc', 'razonSocial', 'regimen', 'cpFiscal', 'usoCfdi', 'correo', 'comentarios'];

/** El formulario fiscal de «Solicitar factura» (bala 7): va dentro del modal del seguimiento. La tienda no timbra; el backend avisa a contabilidad.
 *  Validación local antes del POST; un 400 del servidor marca el campo que nombra la primera palabra de su `message`. */
@Component({
  selector: 'bsv-invoice-form', imports: [FormsModule, Alert, Icon],
  host: { 'data-component': 'InvoiceForm' },
  template: `
  <form class="stack" (submit)="submit($event)" novalidate>
    <p class="small muted" style="margin:0">Pedido <span class="mono">{{ numero() }}</span>@if (total() != null) { · <span class="num">{{ mxn(total()!) }}</span> }</p>
    <bsv-alert kind="info">La factura la timbra nuestro equipo de contabilidad en un máximo de 2 días hábiles y te llega por correo.</bsv-alert>
    <div class="grid md-grid-2">
      <div class="field" [class.has-error]="bad('rfc')"><label for="inv-rfc">RFC *</label><input id="inv-rfc" class="input mono" name="rfc" [value]="f.rfc" (input)="upperRfc($event)" maxlength="13" autocomplete="off" autocapitalize="characters" /><span class="error-msg">{{ msg('rfc') }}</span></div>
      <div class="field" [class.has-error]="bad('razonSocial')"><label for="inv-rs">Razón social *</label><input id="inv-rs" class="input" name="razonSocial" [(ngModel)]="f.razonSocial" maxlength="300" autocomplete="organization" /><span class="error-msg">{{ msg('razonSocial') }}</span></div>
      <div class="field" [class.has-error]="bad('cpFiscal')"><label for="inv-cp">Código postal fiscal *</label><input id="inv-cp" class="input" name="cpFiscal" [(ngModel)]="f.cpFiscal" inputmode="numeric" maxlength="5" autocomplete="postal-code" /><span class="error-msg">{{ msg('cpFiscal') }}</span></div>
      <div class="field" [class.has-error]="bad('regimen')"><label for="inv-reg">Régimen fiscal *</label><select id="inv-reg" class="select" name="regimen" [(ngModel)]="f.regimen"><option value="">Elige tu régimen</option>@for (r of regimenes; track r.clave) { <option [value]="r.clave">{{ r.clave }} · {{ r.nombre }}</option> }</select><span class="error-msg">{{ msg('regimen') }}</span></div>
      <div class="field" [class.has-error]="bad('usoCfdi')"><label for="inv-uso">Uso de CFDI *</label><select id="inv-uso" class="select" name="usoCfdi" [(ngModel)]="f.usoCfdi">@for (u of usos; track u.clave) { <option [value]="u.clave">{{ u.clave }} · {{ u.nombre }}</option> }</select><span class="error-msg">{{ msg('usoCfdi') }}</span></div>
      <div class="field" [class.has-error]="bad('correo')"><label for="inv-mail">Correo para recibirla *</label><input id="inv-mail" class="input" name="correo" type="email" [(ngModel)]="f.correo" maxlength="200" autocomplete="email" /><span class="error-msg">{{ msg('correo') }}</span></div>
    </div>
    <div class="field" [class.has-error]="bad('comentarios')"><label for="inv-obs">Comentarios para contabilidad <span class="muted" style="font-weight:400">(opcional)</span></label><textarea id="inv-obs" class="textarea" name="comentarios" [(ngModel)]="f.comentarios" maxlength="500" style="min-height:72px" placeholder="Ej. requiero complemento de pago"></textarea><span class="error-msg">{{ msg('comentarios') }}</span></div>
    @if (formError()) { <bsv-alert kind="danger">{{ formError() }}</bsv-alert> }
    <div class="row" style="gap:8px;justify-content:flex-end;flex-wrap:wrap">
      <button class="btn btn-ghost" type="button" [disabled]="sending()" (click)="cancelar.emit()">Cerrar</button>
      <button class="btn btn-primary" type="submit" [class.is-loading]="sending()" [disabled]="sending()"><bsv-icon name="receipt" style="--icon:18px" /> {{ sending() ? 'Enviando…' : 'Enviar solicitud' }}</button>
    </div>
  </form>`,
})
export class InvoiceFormComponent {
  folio = input.required<string>(); contacto = input.required<string>(); numero = input<string>(''); total = input<number | null>(null);
  /** La respuesta del POST más el correo al que se pidió (el servidor no lo devuelve). */
  enviada = output<InvoiceRequested & { correo: string }>(); cancelar = output<void>();
  private api = inject(StorefrontApi); mxn = mxn; regimenes = REGIMENES; usos = USOS_CFDI;
  f = { rfc: '', razonSocial: '', regimen: '', cpFiscal: '', usoCfdi: 'G03', correo: '', comentarios: '' };
  private submitted = signal(false); private server = signal<Partial<Record<Field, string>>>({});
  sending = signal(false); formError = signal<string | null>(null);

  constructor() { queueMicrotask(() => { if (!this.f.correo && this.contacto().includes('@')) { this.f.correo = this.contacto().trim(); } }); }

  /** RFC siempre en mayúsculas mientras se escribe. */
  upperRfc(e: Event) { const el = e.target as HTMLInputElement; el.value = el.value.toUpperCase(); this.f.rfc = el.value; }

  private local(field: Field): string | null {
    const v = this.f;
    switch (field) {
      case 'rfc': return RFC_PATTERN.test(v.rfc.trim().toUpperCase()) ? null : 'Revisa tu RFC: son 12 o 13 caracteres (por ejemplo XAXX010101000).';
      case 'razonSocial': return v.razonSocial.trim() ? null : 'Escribe tu razón social.';
      case 'cpFiscal': return /^\d{5}$/.test(v.cpFiscal.trim()) ? null : 'El código postal fiscal son 5 dígitos.';
      case 'regimen': return REGIMENES.some(r => r.clave === v.regimen) ? null : 'Elige tu régimen fiscal.';
      case 'usoCfdi': return USOS_CFDI.some(u => u.clave === v.usoCfdi) ? null : 'Elige el uso de CFDI.';
      case 'correo': return v.correo.includes('@') && v.correo.trim().length <= 200 ? null : 'Escribe un correo válido.';
      default: return null;
    }
  }
  msg(field: Field) { return this.server()[field] ?? (this.submitted() ? this.local(field) : null) ?? ''; }
  bad(field: Field) { return !!this.server()[field] || (this.submitted() && !!this.local(field)); }

  async submit(e: Event) {
    e.preventDefault(); if (this.sending()) { return; }
    this.submitted.set(true); this.server.set({}); this.formError.set(null);
    if (FIELDS.some(x => this.local(x))) { return; }
    this.sending.set(true);
    try {
      const v = this.f;
      const correo = v.correo.trim();
      const res = await this.api.requestInvoice(this.folio(), this.contacto(), { rfc: v.rfc.trim().toUpperCase(), razonSocial: v.razonSocial.trim(), regimen: v.regimen,
        cpFiscal: v.cpFiscal.trim(), usoCfdi: v.usoCfdi, correo, comentarios: v.comentarios.trim() });
      this.enviada.emit({ ...res, correo });
    } catch (err: unknown) {
      const e2 = err as { status?: number; error?: { message?: string } };
      const message = e2.error?.message ?? '';
      const field = FIELDS.find(x => message.startsWith(x));
      if (e2.status === 400 && field) { this.server.set({ [field]: message }); }
      else if (e2.status === 400) { this.formError.set(message || 'Revisa los datos fiscales.'); }
      else if (e2.status === 409) { this.formError.set(message || 'No se puede pedir la factura de este folio.'); }
      else if (e2.status === 404) { this.formError.set('No encontramos este pedido con ese contacto.'); }
      else { this.formError.set('La tienda no respondió. Intenta de nuevo.'); }
    } finally { this.sending.set(false); }
  }
}
