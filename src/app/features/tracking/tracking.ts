import { Component, inject, input, computed, signal, viewChild } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StorefrontApi, TrackingResponse, TrackingState, OrderAddress, InvoiceState, InvoiceRequested } from '../../core/api/storefront-api';
import { InvoiceFormComponent } from './invoice-form';
import { EMPTY_ADDRESS, addressComplete, loadAddress, normalizeAddress, saveAddress } from '../../core/address';
import { mxn } from '../../core/products';
import { Icon, Alert, Timeline, TimelineStep, AddressFields } from '../../shared/ui';
import { ToastService } from '../../core/toast';

/** `/seguimiento` y `/seguimiento/:folio?c=` (bala 5, spec §10): la tienda pregunta al back-office, que pregunta al CRM.
 *  Dos llaves: folio + correo o teléfono. Sin polling: se consulta al abrir y con «Actualizar». Un 404 no distingue causa. */
@Component({
  selector: 'bsv-tracking', imports: [RouterLink, FormsModule, Icon, Alert, Timeline, AddressFields, InvoiceFormComponent],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Seguimiento' },
  template: `
  <h1 style="font-size:var(--text-2xl)">Seguimiento de tu pedido o cotización</h1>
  @if (!key()) {
    <form class="card card-sm" style="max-width:520px" (submit)="go($event)" novalidate data-component="TrackingForm">
      <p class="small muted" style="margin:0 0 12px">Escribe el folio que te dimos y el correo o teléfono con el que compraste o cotizaste.</p>
      <div class="stack-sm">
        <label class="label">Folio<input class="input mono" name="folio" [(ngModel)]="folioInput" maxlength="64" autocomplete="off" /></label>
        <label class="label">Correo o teléfono<input class="input" name="contacto" [(ngModel)]="contactoInput" maxlength="200" autocomplete="email" /></label>
        @if (formError()) { <bsv-alert kind="danger">{{ formError() }}</bsv-alert> }
        <button class="btn btn-primary" type="submit"><bsv-icon name="search" style="--icon:18px" /> Consultar</button>
      </div>
    </form>
  } @else if (remote.hasValue()) {
    @let t = remote.value();
    <div class="cart-layout" data-component="Tracking">
      <div class="stack">
        @if (invoiceNotice()) { <bsv-alert kind="success" data-component="InvoiceNotice">{{ invoiceNotice() }}</bsv-alert> }
        @if (t.obsoleto) { <bsv-alert kind="warning">Mostrando el último estado conocido: no pudimos actualizarlo ahora mismo.</bsv-alert> }
        <div class="card" data-component="TrackingStatus">
          <div class="between" style="flex-wrap:wrap;gap:8px"><div><span class="label">{{ t.tipo === 'pedido' ? 'Pedido' : 'Cotización' }} · folio <span class="mono">{{ t.numero || t.folio }}</span></span><h2 style="margin:4px 0 0;font-size:var(--text-xl)">{{ t.estado === 'entregado' && t.recibio ? 'Entregado a ' + t.recibio : t.titulo }}</h2></div><button class="btn btn-secondary btn-sm" type="button" [class.is-loading]="remote.isLoading()" (click)="remote.reload()"><bsv-icon name="rotate" style="--icon:16px" /> Actualizar</button></div>
          <p style="margin:8px 0 0">{{ t.detalle }}</p>
          @if (t.actualizado) { <p class="xs muted" style="margin:8px 0 0">Última actualización: {{ fecha(t.actualizado) }}</p> }
          <bsv-timeline [steps]="steps()" style="display:block;margin-top:16px" />
        </div>
        @if (t.envios.length) {
          <div class="card" data-component="Shipments"><h3>Envíos</h3>
            @for (e of t.envios; track $index) {
              <div class="card card-sm" style="margin-bottom:8px" data-component="ShipmentCard">
                <div class="between" style="flex-wrap:wrap;gap:8px"><div><strong>{{ e.origen.startsWith('cedis') ? 'Sale de nuestro CEDIS' : 'Sobre pedido · directo del fabricante' }}</strong>
                  @if (e.modo === 'reparto') { <div class="small"><bsv-icon name="truck" style="--icon:14px;vertical-align:-2px" /> Lo entrega un repartidor de Pedrollo</div> }
                  @else if (e.paqueteria || e.guia) { <div class="small">{{ e.paqueteria }} @if (e.guia) { · guía <span class="mono">{{ e.guia }}</span> } </div> }
                  @if (e.entregadoEn) { <div class="small" style="color:var(--color-success,green)">Entregado el {{ fecha(e.entregadoEn) }}@if (e.recibio) { · Recibió: <strong>{{ e.recibio }}</strong> }</div> }
                  @else if (e.enRepartoDesde) { <div class="small">En reparto desde las {{ hora(e.enRepartoDesde) }} · ten a la mano quién lo recibirá</div> }
                  @else if (e.fechaEstimada) { <div class="small muted">Llega aprox. el {{ fecha(e.fechaEstimada) }}</div> }
                  @else { <div class="small muted">Pendiente de embarque</div> } </div>
                  <div class="row" style="gap:6px;flex-wrap:wrap">
                  @if (e.urlRastreo) { <a class="btn btn-secondary btn-sm" [href]="e.urlRastreo" target="_blank" rel="noopener"><bsv-icon name="truck" style="--icon:16px" /> Rastrear</a> }
                  @if (e.remisionUrl) { <a class="btn btn-secondary btn-sm" [href]="remisionUrl(e.remisionUrl)" target="_blank" rel="noopener" data-component="RemisionLink"><bsv-icon name="download" style="--icon:16px" /> {{ e.entregadoEn ? 'Nota de remisión firmada' : 'Ver nota de remisión' }}</a> }
                  </div></div>
                <div class="small muted" style="margin-top:6px">@for (r of e.renglones; track $index) { <span class="model">{{ r.modelo }}</span> × {{ r.cantidad }}@if (!$last) { · } }</div>
              </div> }
          </div> }
        @if (t.cotizacion; as q) {
          <div class="card" data-component="QuoteCard"><h3>Tu cotización</h3>
            <div class="between small" style="flex-wrap:wrap"><span>Folio BSV <span class="mono">{{ q.folio }}</span></span><span class="num">{{ mxn(q.total) }}</span></div>
            @if (q.vigencia) { <p class="small muted" style="margin:4px 0 0">Vigente hasta el {{ fecha(q.vigencia) }}</p> }
            @if (t.estado === 'aceptada') { <bsv-alert kind="success" style="margin-top:12px">Aceptaste esta cotización. Tu asesor te contacta para cerrar el pago y la entrega.</bsv-alert> }
            <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px">
              @if (t.acciones.includes('aceptar')) { <button class="btn btn-primary btn-sm" type="button" data-component="AcceptQuoteButton" (click)="confirming.set(true)"><bsv-icon name="check" style="--icon:16px" /> Aceptar cotización</button> }
              @if (q.documento) { <a class="btn btn-secondary btn-sm" [href]="pdfUrl()" target="_blank" rel="noopener"><bsv-icon name="download" style="--icon:16px" /> Descargar PDF</a> }
            </div>
          </div> }
      </div>
      <aside class="stack">
        @if (t.asesor; as a) { <div class="card" data-component="Advisor"><h4>Tu asesor</h4><p style="margin:0"><strong>{{ a.nombre }}</strong>@if (a.telefono) { <br />{{ a.telefono }} }</p>@if (a.whatsapp) { <a class="btn btn-secondary btn-sm" style="margin-top:12px" [href]="a.whatsapp"><bsv-icon name="phone" style="--icon:16px" /> WhatsApp</a> }</div> }
        @else { <div class="card"><h4>¿Dudas?</h4><p class="small" style="margin:0">Escríbenos por <a href="https://wa.me/525572589681">WhatsApp</a> con tu folio.</p></div> }
        @if (t.pedido; as p) { <div class="card summary" style="position:static"><h4>Pedido {{ p.numero }}</h4>@for (r of p.renglones; track $index) { <div class="between small" style="padding:4px 0"><span><span class="model">{{ r.modelo }}</span> × {{ r.cantidad }}</span></div> }<div class="between" style="margin-top:8px;font-weight:600"><span>Total</span><span class="num">{{ mxn(p.total) }}</span></div></div> }
        @if (t.tipo === 'pedido' && (t.acciones.includes('factura') || t.factura)) {
          <div class="card" data-component="Invoice"><h4>Factura</h4>
            @if (t.factura; as fa) {
              <div class="stack-sm">
                <span class="badge" [class]="invoiceBadge(fa.estado)" data-component="InvoiceBadge">{{ invoiceLabel(fa.estado) }}</span>
                @switch (fa.estado) {
                  @case ('facturada') { <p class="small" style="margin:0">Enviada a <strong>{{ fa.correo }}</strong></p> }
                  @case ('rechazada') { <p class="small" style="margin:0">Contabilidad no pudo facturar con esos datos; revisa tu correo.</p> }
                  @case ('sin_contabilidad') { <p class="small" style="margin:0">Solicitada el {{ fecha(fa.creado) }} · te la hacemos llegar a <strong>{{ fa.correo }}</strong></p> }
                  @default { <p class="small" style="margin:0">Solicitada el {{ fecha(fa.creado) }} · tu CFDI llega a <strong>{{ fa.correo }}</strong> en máximo 2 días hábiles</p> }
                }
              </div>
            } @else { <p class="small" style="margin:0 0 12px">¿Necesitas factura?</p> }
            @if (t.acciones.includes('factura')) { <button class="btn btn-secondary btn-block" style="margin-top:12px" type="button" data-component="InvoiceRequestButton" (click)="invoicing.set(true)"><bsv-icon name="receipt" style="--icon:18px" /> Solicitar factura</button> }
          </div> }
        @if (t.estado === 'cerrada' || t.estado === 'vencida') { <a class="btn btn-primary btn-block" routerLink="/categoria/centrifugas">Cotizar de nuevo</a> }
        <a class="btn btn-ghost btn-block" routerLink="/seguimiento">Consultar otro folio</a>
      </aside>
    </div>
  } @else if (remote.error()) {
    @if (unavailable()) { <div class="empty" data-component="EmptyState/SinConexion"><div class="icon"><bsv-icon name="wifiOff" style="--icon:30px" /></div><h2 style="font-size:var(--text-xl)">No pudimos consultar el seguimiento</h2><p>La tienda no respondió. Intenta de nuevo en un momento.</p><button class="btn btn-primary" type="button" (click)="remote.reload()">Reintentar</button></div> }
    @else { <div class="empty" data-component="EmptyState/Seguimiento"><div class="icon"><bsv-icon name="search" style="--icon:30px" /></div><h2 style="font-size:var(--text-xl)">No encontramos ese folio con ese contacto</h2><p>Revisa que el folio y el correo o teléfono sean los que usaste al comprar o cotizar.</p><a class="btn btn-primary" routerLink="/seguimiento">Intentar de nuevo</a></div> }
  } @else { <div class="btn btn-secondary is-loading" style="margin:40px auto;width:160px"></div> }
  @if (confirming() && remote.hasValue()) {
    @let q = remote.value().cotizacion;
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="accept-title" data-component="AcceptQuoteModal" (click)="$event.target === $event.currentTarget && !accepting() && confirming.set(false)">
      <div class="modal-panel">
        <h3 id="accept-title" style="margin:0 0 8px">Aceptar cotización</h3>
        <p style="margin:0 0 4px">Vas a aceptar la cotización <strong class="mono">{{ remote.value().numero || remote.value().folio }}</strong>@if (q) { por <strong class="num">{{ mxn(q.total) }}</strong> }.</p>
        <p class="small muted" style="margin:0 0 12px">Con esto tu asesor prepara la orden y te contacta para el pago y la entrega. Si quieres cambiar algo, mejor escríbele por WhatsApp.</p>
        @if (remote.value().requiereEntrega) {
          <div style="margin-bottom:12px" data-component="AcceptAddress">
            <strong class="small" style="display:block;margin-bottom:8px">¿A dónde lo enviamos?</strong>
            <bsv-address-fields [(a)]="entrega" [showErrors]="addrErrors()" prefix="acc" />
            <p class="xs muted" style="margin:8px 0 0">La guardamos para tus próximas compras; no la volveremos a pedir.</p>
          </div>
        }
        @if (acceptError()) { <bsv-alert kind="danger" style="margin-bottom:12px">{{ acceptError() }}</bsv-alert> }
        <div class="row" style="gap:8px;justify-content:flex-end;flex-wrap:wrap">
          <button class="btn btn-ghost" type="button" [disabled]="accepting()" (click)="confirming.set(false)">Cerrar</button>
          <button class="btn btn-primary" type="button" [class.is-loading]="accepting()" [disabled]="accepting()" (click)="accept()"><bsv-icon name="check" style="--icon:18px" /> Aceptar</button>
        </div>
      </div>
    </div>
  }
  @if (invoicing() && remote.hasValue() && key(); as k) {
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="invoice-title" data-component="InvoiceModal" (click)="$event.target === $event.currentTarget && !invoiceCmp()?.sending() && invoicing.set(false)">
      <div class="modal-panel">
        <h3 id="invoice-title" style="margin:0 0 12px">Solicitar factura</h3>
        <bsv-invoice-form [folio]="k.folio" [contacto]="k.contacto" [numero]="remote.value().numero || remote.value().folio" [total]="remote.value().pedido?.total ?? null" (enviada)="invoiceSent($event)" (cancelar)="invoicing.set(false)" />
      </div>
    </div>
  }`,
})
export class Tracking {
  folio = input<string>(); c = input<string>();
  private api = inject(StorefrontApi); private router = inject(Router); private toast = inject(ToastService); mxn = mxn;
  invoicing = signal(false); invoiceNotice = signal<string | null>(null); invoiceCmp = viewChild(InvoiceFormComponent);
  confirming = signal(false); accepting = signal(false); acceptError = signal<string | null>(null);
  /** F14: solo se pide cuando el seguimiento dice `requiereEntrega`; prellenada con la que recuerda el dispositivo. */
  entrega = signal<OrderAddress>(loadAddress() ?? { ...EMPTY_ADDRESS }); addrErrors = signal(false);
  folioInput = ''; contactoInput = ''; formError = signal<string | null>(null);
  key = computed(() => { const f = this.folio()?.trim(); const c = this.c()?.trim(); return f && c ? { folio: f, contacto: c } : undefined; });
  remote = this.api.tracking(() => this.key());
  unavailable = computed(() => { const e = this.remote.error() as { status?: number } | undefined; return (e?.status ?? 0) >= 500 || e?.status === 0; });
  steps = computed<TimelineStep[]>(() => this.remote.hasValue() ? buildSteps(this.remote.value()) : []);
  /** El backend manda la URL relativa de la remisión sin el contacto; la segunda llave se añade aquí (misma regla que el PDF de la cotización). */
  remisionUrl(url: string) { const k = this.key(); return k ? `${url}${url.includes('?') ? '&' : '?'}contacto=${encodeURIComponent(k.contacto)}` : url; }
  hora(iso: string) { const d = new Date(iso); return isNaN(d.getTime()) ? iso : d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }
  pdfUrl() { const k = this.key(); return k ? `/api/tienda/v1/seguimiento/${encodeURIComponent(k.folio)}/cotizacion.pdf?contacto=${encodeURIComponent(k.contacto)}` : ''; }
  /** «Aceptar» del modal: una sola llamada; el backend es idempotente y el CRM decide si procede. Al terminar se vuelve a leer el seguimiento. */
  async accept() {
    const k = this.key(); if (!k || this.accepting()) { return; }
    const needsAddress = !!this.remote.value()?.requiereEntrega;
    if (needsAddress && !addressComplete(this.entrega())) { this.addrErrors.set(true); this.acceptError.set('Completa la dirección de entrega.'); return; }
    const entrega = needsAddress ? normalizeAddress(this.entrega()) : undefined;
    this.accepting.set(true); this.acceptError.set(null);
    try {
      await this.api.acceptQuote(k.folio, k.contacto, entrega);
      if (entrega) saveAddress(entrega);
      this.confirming.set(false); this.remote.reload();
      this.toast.show('Cotización aceptada. Tu asesor te contacta.', 'success');
    } catch (err: unknown) {
      const e = err as { status?: number; error?: { message?: string } };
      this.acceptError.set(e.status === 409 ? (e.error?.message || 'Esta cotización ya no se puede aceptar. Consulta a tu asesor.')
        : e.status === 404 ? 'No encontramos esta cotización con ese contacto.'
        : 'No pudimos registrar tu aceptación ahora mismo. Inténtalo de nuevo en unos minutos.');
      if (e.status === 409) { this.remote.reload(); }
    } finally { this.accepting.set(false); }
  }
  invoiceBadge(s: InvoiceState) { return s === 'facturada' ? 'badge badge-success' : s === 'rechazada' ? 'badge badge-danger' : 'badge badge-info'; }
  invoiceLabel(s: InvoiceState) { return s === 'facturada' ? 'Facturada' : s === 'rechazada' ? 'Rechazada' : 'Enviada a contabilidad'; }
  /** La solicitud ya está en el servidor: se cierra el modal, se vuelve a leer el seguimiento (trae el bloque `factura`) y se avisa. */
  invoiceSent(r: InvoiceRequested & { correo: string }) {
    this.invoicing.set(false); this.remote.reload();
    this.invoiceNotice.set(r.yaSolicitada ? `Ya habíamos recibido tu solicitud de factura. Te llega por correo a ${r.correo}.` : `Recibimos tu solicitud. Te llega por correo a ${r.correo}.`);
  }
  go(e: Event) {
    e.preventDefault(); const f = this.folioInput.trim(); const c = this.contactoInput.trim();
    if (!f || !c) { this.formError.set('Escribe el folio y tu correo o teléfono.'); return; }
    this.router.navigate(['/seguimiento', f], { queryParams: { c } });
  }
  /** Una fecha sin hora (`2026-10-28`) se lee como día local, no como medianoche UTC: si no, en México se mostraría el día anterior. */
  fecha(iso: string) { const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso); return isNaN(d.getTime()) ? iso : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', ...(iso.length > 10 ? { hour: '2-digit', minute: '2-digit' } : {}) }); }
}

/** Línea de tiempo por tipo (contrato §8, bala 5d: Enviando / En reparto; limpieza pre-bala 6: «Aceptada» entre lista y preparando). Un pedido por paquetería salta «En reparto»: se marca hecho al entregar. Monótona hacia adelante; `cerrada`/`vencida` marcan el paso actual como rechazado. */
function buildSteps(t: TrackingResponse): TimelineStep[] {
  const pedido = ['Pedido recibido', 'Preparando', 'Enviando', 'En reparto', 'Entregado'];
  const cot = ['Solicitud recibida', 'Cotización lista', 'Aceptada', 'Preparando', 'Enviando', 'En reparto', 'Entregado'];
  const idx: Record<TrackingState, number> = t.tipo === 'pedido'
    ? { pedido_recibido: 0, preparando: 1, en_camino: 2, en_reparto: 3, entregado: 4, recibida: 0, lista: 0, vencida: 0, aceptada: 0, cerrada: 0 }
    : { recibida: 0, lista: 1, vencida: 1, aceptada: 2, preparando: 3, pedido_recibido: 3, en_camino: 4, en_reparto: 5, entregado: 6, cerrada: 0 };
  const titles = t.tipo === 'pedido' ? pedido : cot; const cur = idx[t.estado] ?? 0; const bad = t.estado === 'cerrada' || t.estado === 'vencida';
  return titles.map((title, i) => ({ title, state: i < cur ? 'done' : i === cur ? (bad ? 'rejected' : t.estado === 'entregado' ? 'done' : 'current') : 'pending' }));
}
