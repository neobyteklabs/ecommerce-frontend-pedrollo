import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorefrontApi } from '../../core/api/storefront-api';
import { Alert } from './alert';
import { Icon } from './icon';

/** «Cotizar» (bala 4): la solicitud llega al CRM como lead y una vendedora de BSV responde. Nombre y al menos correo o
 *  teléfono son obligatorios (el CRM rechaza un lead sin contacto). Un UUID por intento evita leads duplicados. */
@Component({
  selector: 'bsv-quote-form', imports: [FormsModule, Alert, Icon],
  host: { class: 'card', 'data-component': 'QuoteForm', style: 'display:block;padding:16px' },
  template: `
  @if (folio()) {
    <bsv-alert kind="success" title="Solicitud enviada">Tu folio es <strong>{{ folio() }}</strong>. Un asesor de Bombas y Sistemas Vega te contacta para cotizar {{ model() }}.</bsv-alert>
  } @else {
    <form (submit)="send($event)" novalidate>
      <h3 style="margin:0 0 4px">Cotizar {{ model() }}</h3>
      <p class="small muted" style="margin:0 0 12px">Sin existencia inmediata. Déjanos tus datos y un asesor te responde con precio y tiempo de entrega.</p>
      <div class="grid md-grid-2" style="gap:12px">
        <label class="label">Nombre *<input class="input" name="nombre" [(ngModel)]="nombre" required maxlength="200" autocomplete="name" /></label>
        <label class="label">Cantidad<input class="input" name="cantidad" type="number" min="1" [(ngModel)]="cantidad" /></label>
        <label class="label">Correo<input class="input" name="correo" type="email" [(ngModel)]="correo" maxlength="200" autocomplete="email" /></label>
        <label class="label">Teléfono<input class="input" name="telefono" type="tel" [(ngModel)]="telefono" maxlength="50" autocomplete="tel" /></label>
        <label class="label">Código postal<input class="input" name="cp" inputmode="numeric" [(ngModel)]="cp" maxlength="5" autocomplete="postal-code" /></label>
      </div>
      <label class="label" style="display:block;margin-top:12px">Mensaje<textarea class="input" name="mensaje" rows="3" [(ngModel)]="mensaje" maxlength="4000"></textarea></label>
      @if (error()) { <bsv-alert kind="danger" style="margin-top:12px">{{ error() }}</bsv-alert> }
      <div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary" type="submit" [class.is-loading]="sending()" [disabled]="sending()"><bsv-icon name="mail" style="--icon:18px" /> Enviar solicitud</button>
        <a class="btn btn-ghost" [href]="'https://wa.me/525572589681?text=Hola, quiero cotizar ' + model()"><bsv-icon name="phone" style="--icon:18px" /> Prefiero WhatsApp</a>
        @if (cancelable()) { <button class="btn btn-ghost" type="button" (click)="cancel.emit()">Cancelar</button> }
      </div>
    </form>
  }`,
})
export class QuoteForm {
  slug = input.required<string>(); model = input.required<string>(); initialQty = input(1); initialCp = input<string | null>(null); cancelable = input(true);
  cancel = output<void>(); sent = output<string>();
  private api = inject(StorefrontApi);
  nombre = ''; correo = ''; telefono = ''; cp = ''; mensaje = ''; cantidad = 1;
  sending = signal(false); error = signal<string | null>(null); folio = signal<string | null>(null);
  private idem = crypto.randomUUID();
  ngOnInit() { this.cantidad = this.initialQty(); this.cp = this.initialCp() ?? ''; }
  async send(e: Event) {
    e.preventDefault(); this.error.set(null);
    if (!this.nombre.trim()) { this.error.set('Escribe tu nombre.'); return; }
    if (!this.correo.trim() && !this.telefono.trim()) { this.error.set('Deja un correo o un teléfono para contactarte.'); return; }
    this.sending.set(true);
    try {
      const r = await this.api.quote({ slug: this.slug(), cantidad: Math.max(1, Number(this.cantidad) || 1), nombre: this.nombre.trim(), correo: this.correo.trim() || undefined, telefono: this.telefono.trim() || undefined, cp: this.cp.trim() || undefined, mensaje: this.mensaje.trim() || undefined }, this.idem);
      this.folio.set(r.folio); this.sent.emit(r.folio);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      this.error.set(status === 400 ? 'Revisa los datos: hace falta un nombre y un correo o teléfono válidos.' : 'No pudimos enviar la solicitud. Intenta de nuevo o escríbenos por WhatsApp.');
      this.idem = crypto.randomUUID();   // un intento nuevo del usuario, una llave nueva
    } finally { this.sending.set(false); }
  }
}
