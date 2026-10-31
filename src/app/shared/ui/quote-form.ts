import { Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StorefrontApi, OrderAddress } from '../../core/api/storefront-api';
import { AddressFields } from './address-fields';
import { EMPTY_ADDRESS, addressComplete, addressEmpty, loadAddress, normalizeAddress, saveAddress } from '../../core/address';
import { Alert } from './alert';
import { Icon } from './icon';

/** «Cotizar» (bala 4): la solicitud llega al CRM como lead y una vendedora de BSV responde. Nombre y al menos correo o
 *  teléfono son obligatorios (el CRM rechaza un lead sin contacto). Un UUID por intento evita leads duplicados. */
@Component({
  selector: 'bsv-quote-form', imports: [FormsModule, RouterLink, Alert, Icon, AddressFields],
  host: { class: 'card', 'data-component': 'QuoteForm', style: 'display:block;padding:16px' },
  template: `
  @if (folio()) {
    <bsv-alert kind="success" title="Solicitud enviada">Tu folio es <strong class="mono">{{ folio() }}</strong>. Un asesor de Bombas y Sistemas Vega te contacta para cotizar {{ model() }}. Guarda tu folio: <a [routerLink]="['/seguimiento', folio()]" [queryParams]="{ c: correo.trim() || telefono.trim() }">aquí ves el avance</a>.</bsv-alert>
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
      <div style="margin-top:12px" data-component="QuoteAddress">
        @if (showAddress()) {
          <div class="between" style="margin-bottom:8px"><strong class="small">Dirección de entrega</strong><button class="btn btn-ghost btn-sm" type="button" (click)="showAddress.set(false)">Quitar</button></div>
          <bsv-address-fields [(a)]="entrega" [showErrors]="addrErrors()" prefix="q" />
          <p class="xs muted" style="margin:8px 0 0">La guardamos para tus próximas compras y cotizaciones; así tu asesor ya sabe a dónde enviar.</p>
        } @else {
          <button class="btn btn-secondary btn-sm" type="button" (click)="showAddress.set(true)"><bsv-icon name="mapPin" style="--icon:16px" /> Agregar dirección de entrega <span class="muted" style="font-weight:400">(opcional)</span></button>
        }
      </div>
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
  /** F14: la dirección es del comprador. Si el dispositivo la recuerda, el bloque viene abierto y prellenado; si no, es opcional. */
  entrega = signal<OrderAddress>({ ...EMPTY_ADDRESS }); showAddress = signal(false); addrErrors = signal(false);
  private idem = crypto.randomUUID();
  ngOnInit() { this.cantidad = this.initialQty(); this.cp = this.initialCp() ?? ''; const saved = loadAddress(); if (saved) { this.entrega.set(saved); this.showAddress.set(true); if (!this.cp) this.cp = saved.cp; } }
  async send(e: Event) {
    e.preventDefault(); this.error.set(null);
    if (!this.nombre.trim()) { this.error.set('Escribe tu nombre.'); return; }
    if (!this.correo.trim() && !this.telefono.trim()) { this.error.set('Deja un correo o un teléfono para contactarte.'); return; }
    const withAddress = this.showAddress() && !addressEmpty(this.entrega());
    if (withAddress && !addressComplete(this.entrega())) { this.addrErrors.set(true); this.error.set('Completa la dirección de entrega o quítala.'); return; }
    const entrega = withAddress ? normalizeAddress(this.entrega()) : undefined;
    this.sending.set(true);
    try {
      const r = await this.api.quote({ slug: this.slug(), cantidad: Math.max(1, Number(this.cantidad) || 1), nombre: this.nombre.trim(), correo: this.correo.trim() || undefined, telefono: this.telefono.trim() || undefined, cp: (entrega?.cp || this.cp.trim()) || undefined, mensaje: this.mensaje.trim() || undefined, entrega }, this.idem);
      if (entrega) saveAddress(entrega);
      this.folio.set(r.numero || r.folio); this.sent.emit(r.numero || r.folio);   // el número legible (COT-…); el UUID solo si el backend aún no lo manda
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      this.error.set(status === 400 ? 'Revisa los datos: hace falta un nombre y un correo o teléfono válidos.' : 'No pudimos enviar la solicitud. Intenta de nuevo o escríbenos por WhatsApp.');
      this.idem = crypto.randomUUID();   // un intento nuevo del usuario, una llave nueva
    } finally { this.sending.set(false); }
  }
}
