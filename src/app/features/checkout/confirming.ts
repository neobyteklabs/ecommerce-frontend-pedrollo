import { Component, inject, input, signal, afterNextRender } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../core/cart';
import { StorefrontApi } from '../../core/api/storefront-api';
import { Icon, Alert } from '../../shared/ui';
import { PayProgress } from './pay-progress';
import { payUrlOf } from './pay-url';

/** `/checkout/confirmando?folio=&c=` (bala 5): cierra el pedido consultando la pasarela desde el backend (idempotente).
 *  Es la `return_url` de Stripe tras 3DS, el regreso desde Mercado Pago (bala 13; sus parámetros de regreso NO deciden nada) y el paso
 *  final en modo simulado. Reintenta tres veces si el pago aún no se refleja. */
@Component({
  selector: 'bsv-confirming', imports: [RouterLink, Icon, Alert, PayProgress],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Confirmando' },
  template: `
  <div class="empty confirm-hero" style="max-width:none" data-component="Confirming">
    @if (state() === 'working' || state() === 'done') { <bsv-pay-progress [done]="state() === 'done'" style="margin-bottom:16px" /><h1 style="font-size:var(--text-2xl);margin:0">{{ state() === 'done' ? '¡Listo! Tu pago quedó confirmado' : 'Procesando tu pago…' }}</h1><p>{{ state() === 'done' ? 'Te llevamos a tu pedido.' : 'No cierres esta ventana. Tarda unos segundos.' }}</p> }
    @else if (state() === 'pending') { <div class="icon"><bsv-icon name="clock" style="--icon:30px" /></div><h1 style="font-size:var(--text-2xl);margin:0">{{ payUrl() ? 'Aún no vemos tu pago' : 'Tu pago sigue en proceso' }}</h1>
      @if (payUrl()) { <p data-component="PagoPendiente/MercadoPago">Si no terminaste de pagar, puedes volver a Mercado Pago: tu pedido sigue apartado unos minutos. Si ya ves el cargo, no lo repitas: se confirma solo en cuanto llegue.</p> }
      @else { <p>Tu banco aún no nos confirma. Si ya ves el cargo, no lo repitas: el pedido se confirma solo en cuanto llegue.</p> }
      <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap">@if (payUrl(); as u) { <a class="btn btn-primary" [href]="u">Volver a Mercado Pago</a> }<button class="btn" [class.btn-primary]="!payUrl()" [class.btn-secondary]="!!payUrl()" type="button" (click)="run()">Volver a revisar</button><a class="btn btn-secondary" [routerLink]="['/seguimiento', folio()]" [queryParams]="{ c: c() }">Ver seguimiento</a></div> }
    @else if (state() === 'failed') { <bsv-alert kind="danger" title="El pago no se completó" style="text-align:left;max-width:560px;margin:0 auto" data-component="Alert/PagoRechazado">No se hizo ningún cargo. Suele pasar por fondos insuficientes o porque el banco bloqueó la compra en línea. Tu mercancía sigue apartada unos minutos.<div class="actions"><a class="btn btn-secondary btn-sm" routerLink="/checkout" [queryParams]="{ step: 2 }">Intentar con otra tarjeta</a><a class="btn btn-ghost btn-sm" href="https://wa.me/525572589681">Pagar por transferencia con un asesor</a></div></bsv-alert> }
    @else { <bsv-alert kind="danger" title="No pudimos confirmar" style="text-align:left;max-width:560px;margin:0 auto">Se perdió la conexión al confirmar. Si ya ves el cargo en tu banco, no lo repitas: revisa el seguimiento con tu folio.<div class="actions"><button class="btn btn-secondary btn-sm" type="button" (click)="run()">Reintentar</button><a class="btn btn-ghost btn-sm" [routerLink]="['/seguimiento', folio()]" [queryParams]="{ c: c() }">Ver seguimiento</a></div></bsv-alert> }
  </div>`,
})
export class Confirming {
  folio = input(''); c = input(''); redirect_status = input<string>();
  private api = inject(StorefrontApi); private cart = inject(CartService); private router = inject(Router);
  state = signal<'working' | 'done' | 'pending' | 'failed' | 'error'>('working');
  /** Bala 13: la URL de pago de Mercado Pago de este pedido, si se creó en esta pestaña (para volver a pagar sin crear otro pedido). */
  payUrl = signal<string | null>(null);
  constructor() { afterNextRender(() => this.run()); }
  async run() {
    if (!this.folio()) { this.router.navigate(['/carrito']); return; }
    this.payUrl.set(payUrlOf(this.folio()));
    if (this.redirect_status() === 'failed') { this.state.set('failed'); return; }
    this.state.set('working');
    for (let i = 0; i < 3; i++) {
      try {
        const r = await this.api.confirmOrder(this.folio());
        if (r.estado === 'pagado') { this.cart.clear(); sessionStorage.removeItem('bsv.checkout'); sessionStorage.removeItem('bsv.pago.' + this.folio()); this.state.set('done'); await new Promise(res => setTimeout(res, 650)); this.router.navigate(['/pedido', this.folio(), 'gracias'], { queryParams: { c: this.c() } }); return; }
        if (r.estado === 'expirado' || r.estado === 'cancelado') { this.state.set('failed'); return; }
      } catch { this.state.set('error'); return; }
      await new Promise(res => setTimeout(res, 1500));
    }
    this.state.set('pending');
  }
}
