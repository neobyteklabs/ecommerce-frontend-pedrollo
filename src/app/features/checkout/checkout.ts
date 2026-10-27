import { Component, inject, input, computed, signal, afterNextRender, effect, PLATFORM_ID, ElementRef, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CartService } from '../../core/cart';
import { ProductService, mxn } from '../../core/products';
import { StorefrontApi, OrderAddress, OrderBuyer, OrderConflict, OrderCreated } from '../../core/api/storefront-api';
import { Icon, Stepper, Alert } from '../../shared/ui';
import type { Stripe, StripeElements } from '@stripe/stripe-js';

const ESTADOS = ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'];
type Form = OrderBuyer & OrderAddress;
const EMPTY: Form = { nombre: '', correo: '', telefono: '', empresa: '', cp: '', calle: '', numeroExt: '', numeroInt: '', colonia: '', municipio: '', estado: 'Ciudad de México', referencias: '' };

/** Checkout real (bala 5): invitado (sin cuenta hasta OIDC), datos y entrega → revisión, cupón y pago con Stripe Payment
 *  Element (o modo simulado si la tienda no tiene llave) → `/checkout/confirmando`. El pedido se crea con `precioEsperado`
 *  por línea: si el backend responde 409 PRECIO_CAMBIO, el carrito aplica los precios nuevos y avisa (Manuel: avisar y actualizar). */
@Component({
  selector: 'bsv-checkout', imports: [RouterLink, FormsModule, Icon, Stepper, Alert],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Checkout' },
  template: `
  <bsv-stepper [steps]="['Datos y entrega', 'Revisión y pago', 'Confirmación']" [current]="step()" />
  @if (!cart.canCheckout()) {
    <div class="empty" data-component="EmptyState/Checkout"><h1 style="font-size:var(--text-2xl)">No hay artículos para pagar</h1><p>Las líneas sin existencia se cotizan con un asesor; agrega al carrito algo con existencia para continuar.</p><a class="btn btn-primary" routerLink="/carrito">Ir al carrito</a></div>
  } @else {
  <div class="checkout-layout">
    <div>
      @if (step() === 1) {
        <h1 style="font-size:var(--text-2xl)">Datos y entrega</h1>
        <form class="stack" (submit)="next($event)" novalidate data-component="CheckoutForm">
          <div class="card card-sm"><h3 style="margin:0 0 12px">Tus datos</h3>
            <div class="grid md-grid-2">
              <div class="field" [class.has-error]="err('nombre')"><label for="f-nombre">Nombre completo *</label><input id="f-nombre" class="input" name="nombre" [(ngModel)]="f.nombre" autocomplete="name" maxlength="200" /><span class="error-msg">Escribe tu nombre.</span></div>
              <div class="field"><label for="f-empresa">Empresa <span class="muted" style="font-weight:400">(opcional)</span></label><input id="f-empresa" class="input" name="empresa" [(ngModel)]="f.empresa" autocomplete="organization" maxlength="200" /></div>
              <div class="field" [class.has-error]="err('correo')"><label for="f-correo">Correo *</label><input id="f-correo" class="input" name="correo" type="email" [(ngModel)]="f.correo" autocomplete="email" maxlength="200" /><span class="hint">Aquí te avisamos del pedido y de su seguimiento</span><span class="error-msg">Escribe un correo válido.</span></div>
              <div class="field" [class.has-error]="err('telefono')"><label for="f-tel">Teléfono *</label><input id="f-tel" class="input" name="telefono" type="tel" inputmode="tel" [(ngModel)]="f.telefono" autocomplete="tel" maxlength="50" /><span class="hint">Para la paquetería</span><span class="error-msg">Escribe un teléfono de 10 dígitos.</span></div>
            </div></div>
          <div class="card card-sm"><h3 style="margin:0 0 12px">Entrega</h3>
            <div class="grid md-grid-2">
              <div class="field" [class.has-error]="err('cp')"><label for="f-cp">Código postal *</label><input id="f-cp" class="input" name="cp" inputmode="numeric" maxlength="5" [(ngModel)]="f.cp" autocomplete="postal-code" /><span class="hint">Define de qué CEDIS sale y los días de entrega</span><span class="error-msg">5 dígitos.</span></div>
              <div class="field" [class.has-error]="err('estado')"><label for="f-edo">Estado *</label><select id="f-edo" class="select" name="estado" [(ngModel)]="f.estado">@for (e of estados; track e) { <option [value]="e">{{ e }}</option> }</select></div>
              <div class="field" style="grid-column:1/-1" [class.has-error]="err('calle')"><label for="f-calle">Calle *</label><input id="f-calle" class="input" name="calle" [(ngModel)]="f.calle" autocomplete="address-line1" maxlength="200" /><span class="error-msg">Escribe la calle.</span></div>
              <div class="field" [class.has-error]="err('numeroExt')"><label for="f-next">Número exterior *</label><input id="f-next" class="input" name="numeroExt" [(ngModel)]="f.numeroExt" maxlength="20" /><span class="error-msg">Obligatorio.</span></div>
              <div class="field"><label for="f-nint">Número interior</label><input id="f-nint" class="input" name="numeroInt" [(ngModel)]="f.numeroInt" maxlength="20" /></div>
              <div class="field" [class.has-error]="err('colonia')"><label for="f-col">Colonia *</label><input id="f-col" class="input" name="colonia" [(ngModel)]="f.colonia" autocomplete="address-level3" maxlength="120" /><span class="error-msg">Escribe la colonia.</span></div>
              <div class="field" [class.has-error]="err('municipio')"><label for="f-mun">Municipio / alcaldía *</label><input id="f-mun" class="input" name="municipio" [(ngModel)]="f.municipio" autocomplete="address-level2" maxlength="120" /><span class="error-msg">Escribe el municipio.</span></div>
              <div class="field" style="grid-column:1/-1"><label for="f-ref">Referencias <span class="muted" style="font-weight:400">(opcional)</span></label><input id="f-ref" class="input" name="referencias" [(ngModel)]="f.referencias" placeholder="Portón negro, entre Av. Gustavo Baz y calle 5" maxlength="300" /></div>
            </div></div>
          <p class="small muted" style="margin:0">¿Necesitas factura? La pides después desde «Solicitar factura» con tu número de pedido.</p>
          <div class="between" style="flex-wrap:wrap"><a class="btn btn-ghost" routerLink="/carrito"><bsv-icon name="arrowLeft" style="--icon:20px" /> Carrito</a><button class="btn btn-primary btn-lg" type="submit">Revisar y pagar <bsv-icon name="arrowRight" style="--icon:20px" /></button></div>
        </form>
      } @else {
        <h1 style="font-size:var(--text-2xl)">Revisión y pago</h1>
        <div class="stack">
          @if (cart.priceChanged(); as pc) { <bsv-alert kind="warning" title="Cambió el precio de {{ products.byId(pc.id)?.model }}" data-component="Alert/PrecioCambio">Lo tenías a {{ mxn(pc.changedFrom!) }} y hoy es {{ mxn(cart.unitPrice(pc)!) }}. El total ya refleja los precios actuales; revísalo antes de pagar.<div class="actions"><button class="btn btn-secondary btn-sm" type="button" (click)="cart.acknowledgePrices()">Entendido</button></div></bsv-alert> }
          @if (error(); as e) { <bsv-alert kind="danger" [title]="e.title" data-component="Alert/Checkout">{{ e.detail }}</bsv-alert> }
          <div class="card card-sm" data-component="ReviewLines"><h3 style="margin:0 0 8px">Artículos</h3>
            @for (l of cart.checkoutLines(); track l.id) {
              @let s = cart.shippingOf(l);
              <div class="between small" style="padding:8px 0;border-bottom:1px solid var(--color-border);align-items:flex-start;gap:12px">
                <div><span class="model">{{ products.byId(l.id)?.model }}</span> × {{ l.qty }}
                  @if (s?.parcial) { <div class="muted">{{ s!.disponible }} salen de CEDIS en {{ s!.dias }} días · {{ l.qty - s!.disponible }} sobre pedido, un asesor confirma la fecha</div> }
                  @else if (s?.dias != null) { <div class="muted">Sale de CEDIS · entrega estimada {{ s!.dias }} días</div> }
                </div>
                <span class="num">{{ mxn(cart.unitPrice(l)! * l.qty) }}</span>
              </div> }
            <div class="between small" style="padding:8px 0"><span>Entrega a</span><span style="text-align:right">{{ f.calle }} {{ f.numeroExt }}{{ f.numeroInt ? ' int. ' + f.numeroInt : '' }}, {{ f.colonia }}<br />{{ f.cp }} {{ f.municipio }}, {{ f.estado }} · <a routerLink="/checkout" [queryParams]="{ step: 1 }">cambiar</a></span></div>
          </div>
          <form class="card card-sm" (submit)="$event.preventDefault(); applyCoupon()" data-component="Coupon"><h3 style="margin:0 0 8px">Cupón</h3>
            <div class="row" style="gap:8px;align-items:flex-end;flex-wrap:wrap"><label class="label" style="flex:1;min-width:200px">Código<input class="input mono" name="cupon" [(ngModel)]="couponInput" maxlength="40" autocapitalize="characters" /></label><button class="btn btn-secondary" type="submit" [class.is-loading]="couponLoading()">Aplicar</button></div>
            @if (cart.coupon(); as c) { @if (c.valido) { <p class="small" style="margin:8px 0 0;color:var(--color-success,green)">Cupón {{ cart.couponCode() }} aplicado: −{{ mxn(c.descuento) }}</p> } @else { <p class="small" style="margin:8px 0 0;color:var(--color-danger,#b00020)">{{ c.motivo || 'Cupón no válido.' }} <span class="muted">Revisa el código tal como te lo enviaron, letra por letra.</span></p> } }
          </form>
          <div class="card card-sm" data-component="Payment"><h3 style="margin:0 0 8px">Pago con tarjeta</h3>
            <div class="row small muted" style="margin-bottom:12px"><bsv-icon name="lock" style="--icon:16px" /> Procesado por Stripe con 3D Secure. Nunca vemos el número completo de tu tarjeta.</div>
            @if (order(); as o) {
              @if (o.pago.modo === 'stripe') { <div #paymentEl data-component="StripePaymentElement"></div>
                @if (stripeReady()) { <button class="btn btn-primary btn-lg btn-block" style="margin-top:16px" type="button" [class.is-loading]="paying()" [disabled]="paying()" (click)="confirmStripe()">Pagar {{ mxn(o.total) }}</button> }
                @else { <div class="btn btn-secondary is-loading btn-block" style="margin-top:16px"></div> } }
            } @else {
              <p class="small muted" style="margin:0 0 12px">Al continuar apartamos tu mercancía 30 minutos mientras pagas.</p>
              <button class="btn btn-primary btn-lg btn-block" type="button" [class.is-loading]="creating()" [disabled]="creating()" (click)="createOrder()">Continuar al pago · {{ mxn(total()) }}</button>
            }
            <p class="xs muted" style="margin:12px 0 0">Tu banco puede pedirte confirmar la compra en su app (3D Secure). No se hace ningún cargo hasta que confirmes.</p>
          </div>
          <div class="between" style="flex-wrap:wrap"><a class="btn btn-ghost" routerLink="/checkout" [queryParams]="{ step: 1 }"><bsv-icon name="arrowLeft" style="--icon:20px" /> Datos</a><a class="btn btn-ghost" href="https://wa.me/525572589681">Prefiero pagar por transferencia con un asesor</a></div>
        </div>
      }
    </div>
    <aside class="card summary" data-component="OrderSummary"><h3>Tu pedido</h3>
      @for (l of cart.checkoutLines(); track l.id) { <div class="between small" style="padding:8px 0;border-bottom:1px solid var(--color-border)"><span><span class="model">{{ products.byId(l.id)?.model }}</span> × {{ l.qty }}</span><span class="num">{{ mxn(cart.unitPrice(l)! * l.qty) }}</span></div> }
      <div class="lines" style="margin-top:12px"><span>Subtotal (sin IVA)</span><span class="num">{{ mxn(cart.base()) }}</span>
        @if (cart.coupon()?.valido) { <span>Cupón {{ cart.couponCode() }}</span><span class="num">−{{ mxn(cart.coupon()!.descuento) }}</span> }
        <span>IVA 16 %</span><span class="num">{{ mxn(cart.ivaWithCoupon()) }}</span><span>Envío</span><span class="num">{{ cart.shippingResult() ? (cart.shipping() == null ? 'Por confirmar' : cart.shipping() ? mxn(cart.shipping()!) : 'Gratis') : 'Según CP' }}</span><span class="total">Total</span><span class="total num">{{ mxn(total()) }}</span></div>
      @if (cart.hasQuoteOnly()) { <p class="xs muted" style="margin:12px 0 0">Las líneas sin existencia no entran a este pedido: cotízalas desde el carrito.</p> }
    </aside>
  </div>
  }`,
})
export class Checkout {
  step = input(1, { transform: (v: unknown) => Number(v) || 1 });
  cart = inject(CartService); products = inject(ProductService); private api = inject(StorefrontApi); private router = inject(Router);
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  paymentEl = viewChild<ElementRef<HTMLDivElement>>('paymentEl');
  estados = ESTADOS; mxn = mxn;
  f: Form = this.loadForm();
  submitted = signal(false); couponInput = ''; couponLoading = signal(false);
  creating = signal(false); paying = signal(false); stripeReady = signal(false);
  order = signal<OrderCreated | null>(null);
  error = signal<{ title: string; detail: string } | null>(null);
  total = computed(() => this.cart.totalWithCoupon() + (this.cart.shipping() ?? 0));
  private stripe: Stripe | null = null; private elements: StripeElements | null = null;

  constructor() {
    afterNextRender(() => {
      this.couponInput = this.cart.couponCode();
      if (this.step() === 2) {
        if (!this.valid()) { this.router.navigate(['/checkout'], { queryParams: { step: 1 } }); return; }
        if (this.f.cp && this.cart.cp() !== this.f.cp) this.cart.cp.set(this.f.cp);
        if (!this.cart.shippingResult() && this.cart.cp()) this.cart.resolveShipping();
        if (this.cart.couponCode()) this.cart.applyCoupon(this.cart.couponCode());
      }
    });
    // Monta el Payment Element en cuanto existe el contenedor y hay pedido en modo Stripe.
    effect(() => { const el = this.paymentEl(); const o = this.order(); if (el && o?.pago.modo === 'stripe' && o.pago.clientSecret && !this.elements) this.mountStripe(el.nativeElement, o.pago.clientSecret); });
  }

  err(k: keyof Form) { return this.submitted() && !this.ok(k); }
  private ok(k: keyof Form): boolean {
    const v = (this.f[k] ?? '').toString().trim();
    switch (k) {
      case 'correo': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      case 'telefono': return v.replace(/\D/g, '').length >= 10;
      case 'cp': return /^\d{5}$/.test(v);
      case 'empresa': case 'numeroInt': case 'referencias': return true;
      default: return v.length > 0;
    }
  }
  private valid() { return (Object.keys(EMPTY) as (keyof Form)[]).every(k => this.ok(k)); }
  next(e: Event) {
    e.preventDefault(); this.submitted.set(true);
    if (!this.valid()) return;
    this.saveForm(); this.cart.cp.set(this.f.cp.trim()); this.cart.resolveShipping();
    this.router.navigate(['/checkout'], { queryParams: { step: 2 } });
  }
  async applyCoupon() { this.couponLoading.set(true); try { await this.cart.applyCoupon(this.couponInput); } finally { this.couponLoading.set(false); } }

  /** Crea el pedido (snapshot + reserva 30 min). Con Stripe, el pago se confirma en el Payment Element; simulado, va directo a confirmar. */
  async createOrder() {
    this.error.set(null); this.creating.set(true);
    try {
      const body = { comprador: this.buyer(), entrega: this.address(), lineas: this.cart.checkoutLines().map(l => ({ slug: l.id, cantidad: l.qty, precioEsperado: this.cart.unitPrice(l)! })), ...(this.cart.coupon()?.valido ? { cupon: this.cart.couponCode() } : {}) };
      const o = await this.api.createOrder(body);
      this.remember(o.folio);
      if (o.pago.modo === 'simulado' || !o.pago.clientSecret) { this.router.navigate(['/checkout/confirmando'], { queryParams: { folio: o.folio, c: this.f.correo.trim() } }); return; }
      this.order.set(o);
    } catch (e) { this.handle(e); } finally { this.creating.set(false); }
  }
  private async mountStripe(host: HTMLElement, clientSecret: string) {
    try {
      const { stripePublishableKey } = await (await fetch('/__config')).json() as { stripePublishableKey: string };
      const { loadStripe } = await import('@stripe/stripe-js');
      this.stripe = await loadStripe(stripePublishableKey, { locale: 'es-419' });
      if (!this.stripe) throw new Error('stripe');
      this.elements = this.stripe.elements({ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#0b2b55', borderRadius: '8px', fontFamily: 'inherit' } } });
      const pe = this.elements.create('payment', { layout: 'tabs' });
      pe.mount(host); pe.on('ready', () => this.stripeReady.set(true));
    } catch { this.error.set({ title: 'No pudimos cargar el pago', detail: 'Recarga la página o escríbenos por WhatsApp para pagar por transferencia.' }); }
  }
  /** Confirma en Stripe. Sin 3DS termina aquí; con 3DS, Stripe redirige a `return_url` y `/checkout/confirmando` cierra el pedido. */
  async confirmStripe() {
    const o = this.order(); if (!this.stripe || !this.elements || !o) return;
    this.paying.set(true); this.error.set(null);
    const returnUrl = `${location.origin}/checkout/confirmando?folio=${encodeURIComponent(o.folio)}&c=${encodeURIComponent(this.f.correo.trim())}`;
    const { error } = await this.stripe.confirmPayment({ elements: this.elements, confirmParams: { return_url: returnUrl }, redirect: 'if_required' });
    if (error) { this.paying.set(false); this.error.set({ title: error.type === 'card_error' ? 'Tu banco rechazó el pago' : 'No se pudo procesar el pago', detail: error.message ?? 'Prueba otra tarjeta o llama a tu banco para autorizar la compra en línea.' }); return; }
    this.router.navigate(['/checkout/confirmando'], { queryParams: { folio: o.folio, c: this.f.correo.trim() } });
  }
  private handle(e: unknown) {
    const err = e as HttpErrorResponse; const body = (err.error ?? {}) as OrderConflict & { message?: string };
    if (err.status === 409 && body.code === 'PRECIO_CAMBIO') { this.cart.applyPriceChanges(body.lineas ?? []); this.error.set({ title: 'Cambió el precio de un artículo', detail: 'Actualizamos el total con los precios de hoy. Revísalo y vuelve a continuar al pago.' }); return; }
    if (err.status === 409 && body.code === 'SIN_EXISTENCIA') { this.cart.shippingResult.set(null); this.error.set({ title: 'Ya no hay existencia suficiente', detail: 'Alguien apartó esa mercancía hace un momento. Ajusta la cantidad en el carrito o pide cotización de esa línea.' }); return; }
    if (err.status === 429) { this.error.set({ title: 'Demasiados intentos', detail: 'Espera un minuto y vuelve a intentar.' }); return; }
    this.error.set({ title: 'No pudimos crear el pedido', detail: body.message || 'Revisa tu conexión e intenta de nuevo. Si el problema sigue, escríbenos por WhatsApp.' });
  }
  private buyer(): OrderBuyer { return { nombre: this.f.nombre.trim(), correo: this.f.correo.trim().toLowerCase(), telefono: this.f.telefono.trim(), ...(this.f.empresa?.trim() ? { empresa: this.f.empresa.trim() } : {}) }; }
  private address(): OrderAddress { return { cp: this.f.cp.trim(), calle: this.f.calle.trim(), numeroExt: this.f.numeroExt.trim(), ...(this.f.numeroInt?.trim() ? { numeroInt: this.f.numeroInt.trim() } : {}), colonia: this.f.colonia.trim(), municipio: this.f.municipio.trim(), estado: this.f.estado, ...(this.f.referencias?.trim() ? { referencias: this.f.referencias.trim() } : {}) }; }
  private loadForm(): Form { if (!this.browser) return { ...EMPTY }; try { return { ...EMPTY, ...(JSON.parse(sessionStorage.getItem('bsv.checkout') || '{}') as Partial<Form>), ...(sessionStorage.getItem('bsv.cp') && !JSON.parse(sessionStorage.getItem('bsv.checkout') || '{}').cp ? { cp: sessionStorage.getItem('bsv.cp')! } : {}) }; } catch { return { ...EMPTY }; } }
  private saveForm() { if (this.browser) sessionStorage.setItem('bsv.checkout', JSON.stringify(this.f)); }
  private remember(folio: string) { if (this.browser) sessionStorage.setItem('bsv.pedido', JSON.stringify({ folio, contacto: this.f.correo.trim() })); }
}
