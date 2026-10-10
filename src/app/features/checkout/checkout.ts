import { Component, inject, input, computed, signal, afterNextRender } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CartService } from '../../core/cart';
import { ProductService, mxn } from '../../core/products';
import { Icon, Stepper, Alert } from '../../shared/ui';

@Component({
  selector: 'bsv-checkout', imports: [RouterLink, Icon, Stepper, Alert],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Checkout' },
  template: `
  <bsv-stepper [current]="step()" />
  @if (step() === 3) {
    <div data-component="OrderConfirmation">
      <div class="empty confirm-hero" style="max-width:none"><div class="icon"><bsv-icon name="check" style="--icon:30px" /></div><h1 style="font-size:var(--text-2xl);margin:0">¡Pedido recibido!</h1><p>Número de pedido <strong class="mono" style="color:var(--color-gold)">BSV-24-01837</strong>. Te enviamos la confirmación a <strong>laura.mendoza&#64;gmail.com</strong>.</p></div>
      <div class="grid md-grid-3" style="margin:24px 0;text-align:left">
        <div class="card card-sm"><span class="label">Entrega estimada</span><div style="font-weight:600">Martes 21 – jueves 23 de octubre</div><span class="small muted">Paquetería asegurada · Tlalnepantla</span></div>
        <div class="card card-sm"><span class="label">Pago</span><div style="font-weight:600">{{ cart.hasUnpriced() ? 'Cotización en proceso' : mxn(total()) + ' · Visa 4242' }}</div><span class="small muted">{{ cart.hasUnpriced() ? 'BSV confirma precio antes de cobrar' : 'Autorizado con 3D Secure' }}</span></div>
        <div class="card card-sm"><span class="label">Factura</span><div style="font-weight:600">Solicítala desde el pedido</div><span class="small muted">Tienes hasta el cierre del mes</span></div>
      </div>
      <div class="row" style="justify-content:center"><a class="btn btn-primary btn-lg" routerLink="/cuenta/pedidos/BSV-24-01837">Ver mi pedido</a><a class="btn btn-secondary btn-lg" routerLink="/cuenta/factura">Solicitar factura</a></div>
      <p class="small muted" style="margin:24px 0 0;text-align:center">¿Dudas? Escríbenos por <a href="https://wa.me/525572589681">WhatsApp</a> con tu número de pedido.</p>
    </div>
  } @else {
  <div class="checkout-layout">
    <div>
      @if (step() === 1) {
        <h1 style="font-size:var(--text-2xl)">Dirección y envío</h1>
        <div class="stack">
          <label class="radio-card" data-component="AddressOption"><input type="radio" name="addr" checked /><div><strong>Taller · Ing. Laura Mendoza</strong><span class="small muted">Av. Mario Colín 125, Col. Industrial La Loma, 54060 Tlalnepantla, Méx. · 55 4421 9087</span></div></label>
          <label class="radio-card" data-component="AddressOption"><input type="radio" name="addr" /><div><strong>Oficina · Laura Mendoza</strong><span class="small muted">Calle Lago Zurich 219, Col. Ampliación Granada, 11529 Miguel Hidalgo, CDMX</span></div></label>
          <details class="card card-sm"><summary style="cursor:pointer;font-weight:600;min-height:28px">+ Agregar dirección nueva</summary>
            <div class="grid md-grid-2" style="margin-top:16px">
              <div class="field"><label for="n">Nombre de quien recibe</label><input id="n" class="input" autocomplete="name" /></div>
              <div class="field"><label for="t">Teléfono</label><input id="t" class="input" type="tel" inputmode="tel" autocomplete="tel" /><span class="hint">Para avisos de la paquetería</span></div>
              <div class="field" style="grid-column:1/-1"><label for="c">Calle y número</label><input id="c" class="input" autocomplete="address-line1" /></div>
              <div class="field"><label for="col">Colonia</label><input id="col" class="input" /></div>
              <div class="field" [class.has-error]="cpErr()"><label for="cp">Código postal</label><input id="cp" class="input" inputmode="numeric" maxlength="5" (input)="cp.set($any($event.target).value)" [attr.aria-invalid]="cpErr()" aria-describedby="cpe" /><span class="hint">5 dígitos</span><span class="error-msg" id="cpe">El código postal debe tener 5 dígitos.</span></div>
              <div class="field"><label for="mun">Municipio / alcaldía</label><input id="mun" class="input" /></div>
              <div class="field"><label for="edo">Estado</label><select id="edo" class="select"><option>Estado de México</option><option>Ciudad de México</option><option>Puebla</option><option>Jalisco</option><option>Yucatán</option></select></div>
              <div class="field" style="grid-column:1/-1"><label for="ref">Referencias <span class="muted" style="font-weight:400">(opcional)</span></label><input id="ref" class="input" placeholder="Portón negro, entre Av. Gustavo Baz y calle 5" /></div>
            </div></details>
          <h3 style="margin-top:8px">Método de envío</h3>
          <label class="radio-card" data-component="ShippingOption"><input type="radio" name="ship" checked /><div class="between" style="flex:1"><div><strong>Paquetería asegurada</strong><span class="small muted">Estafeta o DHL · llega en 2–4 días hábiles tras salir de CEDIS</span></div><strong class="num">{{ cart.shipping() ? mxn(cart.shipping()) : 'Gratis' }}</strong></div></label>
          <label class="radio-card" data-component="ShippingOption"><input type="radio" name="ship" /><div class="between" style="flex:1"><div><strong>Recoger en CEDIS Tlalnepantla</strong><span class="small muted">Lun–Vie 9:00–18:00, Sáb 9:00–13:00 · te avisamos cuando esté listo</span></div><strong class="num">Gratis</strong></div></label>
          <bsv-alert kind="info">Tu pedido incluye artículos sobre pedido. Todo se envía junto en 5–7 días hábiles. <a href="#">Dividir en dos envíos</a></bsv-alert>
          <div class="between" style="flex-wrap:wrap"><a class="btn btn-ghost" routerLink="/carrito"><bsv-icon name="arrowLeft" style="--icon:20px" /> Carrito</a><a class="btn btn-primary btn-lg" routerLink="/checkout" [queryParams]="{ step: 2 }">Continuar al pago <bsv-icon name="arrowRight" style="--icon:20px" /></a></div>
        </div>
      } @else {
        <h1 style="font-size:var(--text-2xl)">Pago</h1>
        @if (declined()) { <bsv-alert kind="danger" title="Tu banco rechazó el pago" data-component="Alert/PagoRechazado">No se hizo ningún cargo. Suele pasar por fondos insuficientes o porque el banco bloqueó la compra en línea. Prueba otra tarjeta o llama a tu banco para autorizarla.<div class="actions"><button class="btn btn-secondary btn-sm" type="button" (click)="newCard.set(true)">Usar otra tarjeta</button><a class="btn btn-ghost btn-sm" href="https://wa.me/525572589681">Pagar por transferencia con un asesor</a></div></bsv-alert> }
        @if (neterr()) { <bsv-alert kind="danger" title="Sin conexión" icon="wifiOff" data-component="Alert/ErrorRed">No pudimos confirmar tu pago porque se perdió la conexión. Revisa tu red. Si ya ves el cargo en tu banco, no lo repitas: escríbenos con el número de referencia.<div class="actions"><a class="btn btn-secondary btn-sm" routerLink="/checkout" [queryParams]="{ step: 2 }">Reintentar</a></div></bsv-alert> }
        <div class="stack">
          <div class="row small muted"><bsv-icon name="lock" style="--icon:16px" /> Procesado por Stripe. Nunca guardamos el número completo de tu tarjeta.</div>
          <label class="radio-card" data-component="PaymentOption/Saved"><input type="radio" name="pay" [checked]="!newCard()" (change)="newCard.set(false)" /><div class="saved-card"><span class="card-brand">VISA</span><div><strong>Visa terminación 4242</strong><span class="small muted">Vence 08/28 · Laura Mendoza</span></div></div></label>
          <label class="radio-card" data-component="PaymentOption/New" style="flex-direction:column;align-items:stretch"><div class="row"><input type="radio" name="pay" [checked]="newCard()" (change)="newCard.set(true)" /><strong>Tarjeta nueva</strong><span class="row" style="margin-left:auto;gap:4px"><span class="card-brand">VISA</span><span class="card-brand">MC</span><span class="card-brand">AMEX</span></span></div>
            <div class="grid" style="margin-top:12px;grid-template-columns:1fr 1fr">
              <div class="field" style="grid-column:1/-1"><label for="cn">Número de tarjeta</label><input id="cn" class="input mono" inputmode="numeric" placeholder="0000 0000 0000 0000" autocomplete="cc-number" /></div>
              <div class="field"><label for="ce">Vencimiento</label><input id="ce" class="input mono" placeholder="MM / AA" inputmode="numeric" autocomplete="cc-exp" /></div>
              <div class="field"><label for="cv">CVC</label><input id="cv" class="input mono" inputmode="numeric" placeholder="123" autocomplete="cc-csc" /><span class="hint">3 dígitos al reverso, 4 en Amex</span></div>
              <div class="field" style="grid-column:1/-1"><label for="cnm">Nombre como aparece en la tarjeta</label><input id="cnm" class="input" autocomplete="cc-name" /></div>
              <label class="check" style="grid-column:1/-1;min-height:36px"><input type="checkbox" checked /> Guardar esta tarjeta para la próxima compra</label>
            </div></label>
          <bsv-alert kind="info" icon="shield">Tu banco puede pedirte confirmar la compra en su app (3D Secure). Mantén el teléfono a la mano.</bsv-alert>
          <div class="between" style="flex-wrap:wrap"><a class="btn btn-ghost" routerLink="/checkout" [queryParams]="{ step: 1 }"><bsv-icon name="arrowLeft" style="--icon:20px" /> Dirección</a><button class="btn btn-primary btn-lg" type="button" [class.is-loading]="paying()" (click)="pay()">{{ cart.hasUnpriced() ? 'Enviar solicitud de cotización' : 'Pagar ' + mxn(total()) }}</button></div>
          <p class="xs muted">Enlaces del prototipo: <a routerLink="/checkout" [queryParams]="{ step: 2, declined: 1 }">simular pago rechazado</a> · <a routerLink="/checkout" [queryParams]="{ step: 2, neterr: 1 }">simular error de red</a></p>
        </div>
        <div class="modal" [hidden]="!tds()" role="dialog" aria-modal="true" aria-labelledby="tdst" data-component="Modal/3DS"><div class="modal-panel" style="text-align:center"><h3 id="tdst">Confirma en tu banco</h3><p class="muted">Abrimos la verificación 3D Secure de tu banco. No cierres esta ventana.</p><div class="btn btn-secondary is-loading" style="margin:16px auto;width:160px"></div><p class="small muted" style="margin:0">Cargo a Visa 4242</p></div></div>
      }
    </div>
    <aside class="card summary" data-component="OrderSummary"><h3>Tu pedido</h3>
      @for (l of cart.lines(); track l.id) { <div class="between small" style="padding:8px 0;border-bottom:1px solid var(--color-border)"><span><span class="model">{{ products.byId(l.id)!.model }}</span> × {{ l.qty }}</span><span class="num">{{ products.byId(l.id)!.price != null ? mxn(products.byId(l.id)!.price! * l.qty) : 'Por cotizar' }}</span></div> }
      <div class="lines" style="margin-top:12px"><span>Subtotal</span><span class="num">{{ mxn(cart.base()) }}</span><span>IVA 16 %</span><span class="num">{{ mxn(cart.iva()) }}</span><span>Envío</span><span class="num">{{ cart.shipping() ? mxn(cart.shipping()) : 'Gratis' }}</span><span class="total">Total</span><span class="total num">{{ cart.hasUnpriced() ? 'Por cotizar' : mxn(total()) }}</span></div></aside>
  </div>
  }`,
})
export class Checkout {
  step = input(1, { transform: (v: unknown) => Number(v) || 1 }); declined = input<string>(); neterr = input<string>();
  cart = inject(CartService); products = inject(ProductService); private router = inject(Router);
  total = computed(() => this.cart.total() + this.cart.shipping());
  cp = signal(''); cpErr = computed(() => this.cp().length > 0 && this.cp().length !== 5);
  newCard = signal(false); paying = signal(false); tds = signal(false); mxn = mxn;
  constructor() { afterNextRender(() => { if (!this.cart.count() && this.step() < 3) this.cart.demo(); }); }
  pay() { this.paying.set(true); setTimeout(() => this.tds.set(true), 500); setTimeout(() => { this.cart.clear(); this.router.navigate(['/checkout'], { queryParams: { step: 3 } }); }, 2600); }
}
