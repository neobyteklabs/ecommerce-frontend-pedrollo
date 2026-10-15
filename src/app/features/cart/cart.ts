import { Component, inject, input, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart';
import { ProductService, availLabel, mxn } from '../../core/products';
import { ToastService } from '../../core/toast';
import { Icon, ImgSlot, Qty, Alert, Empty } from '../../shared/ui';

@Component({
  selector: 'bsv-cart', imports: [RouterLink, Icon, ImgSlot, Qty, Alert, Empty],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Carrito' },
  template: `
  @if (!cart.lines().length) {
    <h1 style="font-size:var(--text-2xl)">Tu carrito</h1>
    <bsv-empty icon="cart" title="Tu carrito está vacío" data-component="EmptyState/Carrito">Agrega bombas, motores o refacciones. Los precios incluyen IVA y la factura se solicita desde tu cuenta.
      <ng-container actions><a class="btn btn-primary" routerLink="/categoria/superficie">Ver catálogo</a><a class="btn btn-ghost" routerLink="/cuenta/pedidos">Repetir un pedido anterior</a></ng-container></bsv-empty>
  } @else {
    <h1 style="font-size:var(--text-2xl)">Tu carrito <span class="muted" style="font-weight:500;font-size:var(--text-lg)">· {{ cart.count() }} artículos</span></h1>
    @if (cart.priceChanged(); as ch) {
      <bsv-alert kind="warning" [title]="'El precio de ' + products.byId(ch.id)!.model + ' cambió'" style="margin-bottom:16px" data-component="Alert/PrecioCambio">Lo agregaste a {{ mxn(ch.priceAtAdd) }} y hoy es {{ mxn(products.byId(ch.id)!.price) }}. El total ya refleja el precio actual.<div class="actions"><button class="btn btn-secondary btn-sm" type="button" (click)="cart.acknowledgePrices()">Entendido</button></div></bsv-alert>
    }
    <div class="cart-layout">
      <div class="card" style="padding-block:0">
        @for (l of cart.lines(); track l.id) { @let p = products.byId(l.id)!;
          <div class="cart-line" data-component="CartLine">
            <bsv-img-slot [slot]="l.id" [product]="true" />
            <div><a class="model" [routerLink]="['/producto', l.id]" style="text-decoration:none">{{ p.model }}</a><div style="font-weight:600">{{ p.name }}</div><div class="small muted">{{ cart.unitPrice(l) != null ? mxn(cart.unitPrice(l)) + ' c/u' : 'Precio por confirmar' }} · {{ availLabel(p.avail) }}</div></div>
            <div class="line-actions"><bsv-qty [value]="l.qty" (valueChange)="cart.setQty(l.id, $event)" /><span class="line-total num" style="min-width:110px">{{ cart.unitPrice(l) != null ? mxn(cart.unitPrice(l)! * l.qty) : 'Por cotizar' }}</span><button class="icon-btn" type="button" [attr.aria-label]="'Quitar ' + p.model" (click)="cart.remove(l.id); toast.show(p.model + ' eliminado')"><bsv-icon name="trash" /></button></div>
          </div> }
        <div style="padding:16px 0"><a routerLink="/categoria/superficie"><bsv-icon name="arrowLeft" style="--icon:18px;vertical-align:-3px" /> Seguir comprando</a></div>
      </div>
      <aside class="card summary" data-component="OrderSummary">
        <h3>Resumen</h3>
        <div class="lines"><span>Subtotal (sin IVA)</span><span class="num">{{ mxn(cart.base()) }}</span><span>IVA 16 %</span><span class="num">{{ mxn(cart.iva()) }}</span><span>Envío estimado <span class="muted small">(CDMX y Edo. Méx.)</span></span><span class="num">{{ cart.shipping() ? mxn(cart.shipping()) : 'Gratis' }}</span><span class="total">Total</span><span class="total num">{{ cart.hasUnpriced() ? 'Por cotizar' : mxn(cart.total() + cart.shipping()) }}</span></div>
        @if (cart.hasUnpriced()) { <bsv-alert kind="info" style="margin-top:12px">Hay artículos sin precio confirmado. Al continuar, BSV te enviará la cotización antes de cobrar.</bsv-alert> }
        <p class="small muted" style="margin:12px 0 16px">El envío final se calcula con tu código postal en el siguiente paso. Pedidos mayores a $5,000 tienen envío gratis en zona metropolitana.</p>
        <a class="btn btn-primary btn-lg btn-block" routerLink="/checkout">{{ cart.hasUnpriced() ? 'Solicitar cotización' : 'Continuar al pago' }} <bsv-icon name="arrowRight" style="--icon:20px" /></a>
        <div class="row small muted" style="justify-content:center;margin-top:12px"><bsv-icon name="lock" style="--icon:16px" /> Pago seguro con Stripe · 3D Secure</div>
      </aside>
    </div>
  }`,
})
export class Cart {
  demo = input<string>();
  cart = inject(CartService); products = inject(ProductService); toast = inject(ToastService); mxn = mxn; availLabel = availLabel;
  constructor() { afterNextRender(() => { if (this.demo()) this.cart.demo(); }); }
}
