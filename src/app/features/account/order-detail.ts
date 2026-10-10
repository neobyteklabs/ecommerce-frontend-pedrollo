import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, ImgSlot, Timeline, TimelineStep } from '../../shared/ui';
import { Reveal } from '../../shared/directives/motion';

@Component({
  selector: 'bsv-order-detail', imports: [RouterLink, Icon, ImgSlot, Timeline, Reveal],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'DetallePedido' },
  template: `
  <nav aria-label="Migas de pan"><ol class="breadcrumb"><li><a routerLink="/cuenta">Mi cuenta</a></li><li><a routerLink="/cuenta/pedidos">Mis pedidos</a></li><li aria-current="page">{{ id() }}</li></ol></nav>
  <div class="between" style="flex-wrap:wrap;margin-bottom:24px"><div><h1 style="font-size:var(--text-2xl);margin-bottom:4px">Pedido <span class="mono">{{ id() }}</span></h1><span class="muted small">Realizado el 8 de octubre de 2026 · 3 artículos · $13,580.00</span></div><span class="badge badge-enviado" style="font-size:var(--text-sm)">Enviado</span></div>
  <div class="cart-layout">
    <div class="stack">
      <div class="card" data-component="OrderTimelineCard" bsvReveal><h3>Seguimiento</h3>
        <bsv-timeline [steps]="steps">
          <div class="t-body card card-sm" style="margin-top:8px" data-component="ShipmentCard"><div class="between" style="flex-wrap:wrap"><div><strong>Estafeta</strong><div class="small muted">Guía <span class="mono">7845 0012 3391 07</span></div></div><a class="btn btn-secondary btn-sm" href="#" style="min-height:44px">Rastrear envío <bsv-icon name="arrowRight" style="--icon:18px" /></a></div><div class="small muted" style="margin-top:8px">Entrega estimada: martes 21 – jueves 23 de octubre</div></div>
        </bsv-timeline></div>
      <div class="card" data-component="OrderLines" bsvReveal [revealIndex]="1"><h3>Artículos</h3>
        <div class="cart-line"><bsv-img-slot slot="catalog-pk" [product]="true" /><div><span class="model">PKm 60</span><div style="font-weight:600">Bomba periférica monofásica 0.5 HP</div><div class="small muted">$1,890.00 × 2</div></div><div class="line-actions"><span class="line-total num">$3,780.00</span><a class="btn btn-ghost btn-sm" routerLink="/producto/pk-60">Volver a comprar</a></div></div>
        <div class="cart-line" style="border-bottom:0"><bsv-img-slot slot="catalog-4sr" [product]="true" /><div><span class="model">4SR 2/9</span><div style="font-weight:600">Bomba sumergible 4" para pozo 1 HP</div><div class="small muted">$9,850.00 × 1</div></div><div class="line-actions"><span class="line-total num">$9,850.00</span><a class="btn btn-ghost btn-sm" routerLink="/producto/4sr60g-15">Volver a comprar</a></div></div></div>
    </div>
    <aside class="stack">
      <div class="card" data-component="OrderActions" bsvReveal><h3>Acciones</h3><div class="stack-sm"><a class="btn btn-primary btn-block" routerLink="/cuenta/factura"><bsv-icon name="receipt" style="--icon:20px" /> Solicitar factura</a><a class="btn btn-secondary btn-block" routerLink="/cuenta/devolucion"><bsv-icon name="rotate" style="--icon:20px" /> Solicitar devolución</a><a class="btn btn-ghost btn-block" [href]="'https://wa.me/525572589681?text=Pedido ' + id()"><bsv-icon name="phone" style="--icon:20px" /> Ayuda con este pedido</a></div></div>
      <div class="card" bsvReveal [revealIndex]="1"><h4>Envío a</h4><p class="small" style="margin:0">Ing. Laura Mendoza<br />Av. Mario Colín 125, Col. Industrial La Loma<br />54060 Tlalnepantla de Baz, Méx.<br />55 4421 9087</p></div>
      <div class="card summary" style="position:static" bsvReveal [revealIndex]="2"><h4>Resumen</h4><div class="lines"><span>Subtotal</span><span class="num">$11,706.90</span><span>IVA 16 %</span><span class="num">$1,873.10</span><span>Envío</span><span class="num">Gratis</span><span class="total">Total</span><span class="total num">$13,580.00</span></div><p class="small muted" style="margin:12px 0 0">Pagado con Visa 4242 · ref. Stripe <span class="mono">pi_3Q…8kz</span></p></div>
    </aside>
  </div>`,
})
export class OrderDetail {
  id = input('BSV-24-01837');
  steps: TimelineStep[] = [{ title: 'Pedido recibido', meta: '8 oct · 10:42', state: 'done' }, { title: 'Pago confirmado', meta: '8 oct · 10:43 · Visa 4242 · $13,580.00', state: 'done' }, { title: 'En preparación', meta: '9 oct · CEDIS Tlalnepantla', state: 'done' }, { title: 'Enviado', meta: '10 oct · 16:20', state: 'current' }, { title: 'Entregado', meta: 'Pendiente', state: 'pending' }];
}
