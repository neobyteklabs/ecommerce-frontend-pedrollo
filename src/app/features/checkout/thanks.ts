import { Component, inject, input, signal, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StorefrontApi, OrderView } from '../../core/api/storefront-api';
import { mxn } from '../../core/products';
import { Icon } from '../../shared/ui';

/** `/pedido/:folio/gracias?c=` (bala 5): confirmación con el número de pedido real y el enlace al seguimiento. */
@Component({
  selector: 'bsv-thanks', imports: [RouterLink, Icon],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Gracias' },
  template: `
  @if (order(); as o) {
    <div data-component="OrderConfirmation">
      <div class="empty confirm-hero" style="max-width:none"><div class="icon"><bsv-icon name="check" style="--icon:30px" /></div><h1 style="font-size:var(--text-2xl);margin:0">¡Pedido recibido!</h1><p>Número de pedido <strong class="mono" style="color:var(--color-gold)">{{ o.numero }}</strong>. Te enviamos la confirmación a <strong>{{ o.comprador.correo }}</strong> y ahí mismo te avisamos de cada avance.</p></div>
      <div class="grid md-grid-3" style="margin:24px 0;text-align:left">
        <div class="card card-sm"><span class="label">Entrega</span><div style="font-weight:600">{{ o.entrega.calle }} {{ o.entrega.numeroExt }}, {{ o.entrega.colonia }}</div><span class="small muted">{{ o.entrega.cp }} {{ o.entrega.municipio }}, {{ o.entrega.estado }}</span></div>
        <div class="card card-sm"><span class="label">Pago</span><div style="font-weight:600">{{ mxn(o.total) }}</div><span class="small muted">{{ o.pago?.modo === 'simulado' ? 'Pago simulado (entorno de prueba)' : 'Tarjeta · autorizado con 3D Secure' }}</span></div>
        <div class="card card-sm"><span class="label">Factura</span><div style="font-weight:600">Solicítala con tu número de pedido</div><span class="small muted">Desde «Solicitar factura»</span></div>
      </div>
      <div class="card card-sm" style="text-align:left" data-component="OrderLines"><h3 style="margin:0 0 8px">Artículos</h3>
        @for (r of o.renglones; track $index) { <div class="between small" style="padding:8px 0;border-bottom:1px solid var(--color-border)"><span><span class="model">{{ r.modelo }}</span> × {{ r.cantidad }}<div class="muted">{{ r.sobrePedido ? 'Sobre pedido: un asesor confirma la fecha' : 'Sale de CEDIS' + (r.diasEstimados != null ? ' · ' + r.diasEstimados + ' días' : '') }}</div></span><span class="num">{{ mxn(r.importe) }}</span></div> }
        <div class="lines" style="margin-top:12px"><span>Subtotal (sin IVA)</span><span class="num">{{ mxn(o.subtotal) }}</span>@if (o.descuentoCupon) { <span>Cupón {{ o.cuponCodigo }}</span><span class="num">−{{ mxn(o.descuentoCupon) }}</span> }<span>IVA 16 %</span><span class="num">{{ mxn(o.iva) }}</span><span>Envío</span><span class="num">{{ o.envio ? mxn(o.envio) : 'Gratis' }}</span><span class="total">Total</span><span class="total num">{{ mxn(o.total) }}</span></div>
      </div>
      <div class="row" style="justify-content:center;margin-top:24px;flex-wrap:wrap"><a class="btn btn-primary btn-lg" [routerLink]="['/seguimiento', o.folio]" [queryParams]="{ c: c() }"><bsv-icon name="truck" style="--icon:20px" /> Seguir mi pedido</a><a class="btn btn-secondary btn-lg" routerLink="/cuenta/factura">Solicitar factura</a></div>
      <p class="small muted" style="margin:24px 0 0;text-align:center">Guarda tu folio <span class="mono">{{ o.folio }}</span>. ¿Dudas? Escríbenos por <a href="https://wa.me/525572589681">WhatsApp</a> con tu número de pedido.</p>
    </div>
  } @else if (missing()) {
    <div class="empty"><h1 style="font-size:var(--text-2xl)">No encontramos ese pedido</h1><p>Revisa el enlace de tu correo o consulta el seguimiento con tu folio y tu correo.</p><a class="btn btn-primary" routerLink="/seguimiento">Ir al seguimiento</a></div>
  } @else { <div class="btn btn-secondary is-loading" style="margin:40px auto;width:160px"></div> }`,
})
export class Thanks {
  folio = input(''); c = input('');
  private api = inject(StorefrontApi); mxn = mxn;
  order = signal<OrderView | null>(null); missing = signal(false);
  constructor() { afterNextRender(async () => { try { this.order.set(await this.api.order(this.folio(), this.c())); } catch { this.missing.set(true); } }); }
}
