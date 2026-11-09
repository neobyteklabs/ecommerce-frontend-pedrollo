import { Component, inject, input, signal, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, CartLine } from '../../core/cart';
import { ProductService, mxn } from '../../core/products';
import { ToastService } from '../../core/toast';
import { Icon, ImgSlot, Qty, Alert, Empty, QuoteForm } from '../../shared/ui';

/** Carrito (bala 4): pide el código postal, resuelve el envío por línea con la API (días, parciales, por cotizar) y avisa
 *  cuando un precio cambió desde que se agregó (Manuel: avisar y actualizar). Sin reservas ni pago: eso es la bala 5. */
@Component({
  selector: 'bsv-cart', imports: [RouterLink, FormsModule, Icon, ImgSlot, Qty, Alert, Empty, QuoteForm],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Carrito' },
  template: `
  @if (!cart.lines().length) {
    <h1 style="font-size:var(--text-2xl)">Tu carrito</h1>
    <bsv-empty icon="cart" title="Tu carrito está vacío" data-component="EmptyState/Carrito">Agrega bombas, motores o refacciones. Los precios incluyen IVA y la factura se solicita desde tu cuenta.
      <ng-container actions><a class="btn btn-primary" routerLink="/categoria/centrifugas">Ver catálogo</a><a class="btn btn-ghost" routerLink="/cuenta/pedidos">Repetir un pedido anterior</a></ng-container></bsv-empty>
  } @else {
    <h1 style="font-size:var(--text-2xl)">Tu carrito <span class="muted" style="font-weight:500;font-size:var(--text-lg)">· {{ cart.count() }} artículos</span></h1>
    @if (cart.changed().length) {
      <bsv-alert kind="warning" [title]="cart.changed().length === 1 ? 'El precio de ' + products.byId(cart.changed()[0].id)!.model + ' cambió' : 'Algunos de tus productos cambiaron de precio'" style="margin-bottom:16px" data-component="Alert/PrecioCambio">
        @for (l of cart.changed(); track l.id) { <div>{{ products.byId(l.id)!.model }}: lo agregaste a {{ mxn(l.changedFrom) }} y hoy es {{ mxn(l.priceAtAdd) }}.</div> }
        El total ya refleja los precios actuales.<div class="actions"><button class="btn btn-secondary btn-sm" type="button" (click)="cart.acknowledgePrices()">Entendido</button></div></bsv-alert>
    }
    <div class="cart-layout">
      <div class="card" style="padding-block:0">
        @for (l of cart.lines(); track l.id) { @let p = products.byId(l.id)!; @let s = cart.shippingOf(l);
          <div class="cart-line" data-component="CartLine" [class.is-quote]="s?.estado === 'cotizar'">
            <bsv-img-slot [slot]="l.id" [src]="l.imagen ?? p.catalog" [product]="true" [alt]="p.model" />
            <div>
              <a class="model" [routerLink]="['/producto', l.id]" style="text-decoration:none">{{ p.model }}</a>@if (l.changedFrom != null) { <span class="badge badge-warning no-dot" style="margin-left:8px">precio actualizado</span> }
              <div style="font-weight:600">{{ p.name }}</div>
              <div class="small muted">{{ cart.unitPrice(l) != null ? mxn(cart.unitPrice(l)) + ' c/u' : 'Precio por confirmar' }}</div>
              @if (s) {
                @if (s.estado === 'carrito' && !s.parcial) { <div class="small" style="color:var(--color-success)"><bsv-icon name="truck" style="--icon:16px;vertical-align:-3px" /> En existencia · entrega estimada {{ s.dias }} {{ s.dias === 1 ? 'día' : 'días' }}</div> }
                @else if (s.estado === 'carrito' && s.parcial) { <div class="small" style="color:var(--color-warning)"><bsv-icon name="alert" style="--icon:16px;vertical-align:-3px" /> Solo {{ s.disponible }} de {{ s.solicitado }} en existencia ({{ s.dias }} días); el resto sobre pedido</div> }
                @else { <div class="small muted"><bsv-icon name="phone" style="--icon:16px;vertical-align:-3px" /> Sin existencia: por cotizar</div>
                  @if (quoting() === l.id) { <bsv-quote-form style="margin-top:8px" [slug]="l.id" [model]="p.model" [initialQty]="l.qty" [initialCp]="cart.cp()" (cancel)="quoting.set(null)" (sent)="quoting.set(null); toast.show('Cotización ' + $event + ' enviada', 'success')" /> }
                  @else { <button class="btn btn-secondary btn-sm" type="button" style="margin-top:6px" (click)="quoting.set(l.id)">Cotizar esta línea</button> } }
              }
            </div>
            <div class="line-actions"><bsv-qty [value]="l.qty" (valueChange)="cart.setQty(l.id, $event)" /><span class="line-total num" style="min-width:110px">{{ s?.estado === 'cotizar' || cart.unitPrice(l) == null ? 'Por cotizar' : mxn(cart.unitPrice(l)! * l.qty) }}</span><button class="icon-btn" type="button" [attr.aria-label]="'Quitar ' + p.model" (click)="cart.remove(l.id); toast.show(p.model + ' eliminado')"><bsv-icon name="trash" /></button></div>
          </div> }
        <div style="padding:16px 0"><a routerLink="/categoria/centrifugas"><bsv-icon name="arrowLeft" style="--icon:18px;vertical-align:-3px" /> Seguir comprando</a></div>
      </div>
      <aside class="card summary" data-component="OrderSummary">
        <h3>Resumen</h3>
        <form class="row" style="gap:8px;align-items:flex-end;margin-bottom:12px" (submit)="$event.preventDefault(); cart.resolveShipping()" data-component="ShippingCP">
          <label class="label" style="flex:1">Código postal de envío<input class="input" name="cp" inputmode="numeric" maxlength="5" placeholder="06600" [ngModel]="cart.cp()" (ngModelChange)="cart.cp.set($event)" autocomplete="postal-code" /></label>
          <button class="btn btn-secondary" type="submit" [class.is-loading]="cart.shippingLoading()">Calcular</button>
        </form>
        @if (cart.shippingError()) { <bsv-alert kind="danger" style="margin-bottom:12px">{{ cart.shippingError() }}</bsv-alert> }
        @if (cart.shippingResult(); as sr) { <p class="small muted" style="margin:0 0 12px">Zona: {{ sr.zonaNombre ?? sr.zona }}</p> }
        <div class="lines"><span>Subtotal (sin IVA)</span><span class="num">{{ mxn(cart.base()) }}</span><span>IVA 16 %</span><span class="num">{{ mxn(cart.iva()) }}</span><span>Envío</span><span class="num">{{ cart.shippingResult() ? (cart.shipping() == null ? 'Se confirma al pagar' : (cart.shipping() === 0 ? 'Gratis' : mxn(cart.shipping()))) : 'Calcula con tu CP' }}</span><span class="total">Total</span><span class="total num">{{ cart.hasUnpriced() ? 'Por cotizar' : mxn(cart.total() + (cart.shipping() ?? 0)) }}</span></div>
        @if (cart.hasQuoteOnly()) { <bsv-alert kind="info" style="margin-top:12px">Las líneas sin existencia no entran al total: cotízalas y un asesor te confirma precio y entrega.</bsv-alert> }
        @if (cart.hasUnpriced()) { <bsv-alert kind="info" style="margin-top:12px">Hay artículos sin precio confirmado. Al continuar, BSV te enviará la cotización antes de cobrar.</bsv-alert> }
        @if (cart.canCheckout()) { <a class="btn btn-primary btn-lg btn-block" style="margin-top:16px" routerLink="/checkout">Continuar al pago <bsv-icon name="arrowRight" style="--icon:20px" /></a> }
        @else { <span class="btn btn-primary btn-lg btn-block" style="margin-top:16px;opacity:.5;pointer-events:none" aria-disabled="true">Continuar al pago</span><p class="xs muted" style="margin:8px 0 0;text-align:center">Calcula el envío con tu CP; las líneas por cotizar se atienden con un asesor.</p> }
        <div class="row small muted" style="justify-content:center;margin-top:12px"><bsv-icon name="lock" style="--icon:16px" /> Pago seguro con Stripe · 3D Secure</div>
      </aside>
    </div>
  }`,
})
export class Cart {
  demo = input<string>();
  cart = inject(CartService); products = inject(ProductService); toast = inject(ToastService); mxn = mxn;
  quoting = signal<string | null>(null);
  constructor() { afterNextRender(async () => { if (this.demo()) this.cart.demo(); await this.cart.refreshPrices(); if (this.cart.cp() && this.cart.lines().length) this.cart.resolveShipping(); }); }
}
