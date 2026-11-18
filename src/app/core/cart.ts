import { Injectable, signal, computed, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProductService, IVA } from './products';
import { StorefrontApi, ShippingResponse, ShippingLine, CouponResponse } from './api/storefront-api';

/** `fromApi`: el precio vino de la API de tienda al agregar. `changedFrom`: el precio anterior cuando la API devolvió otro
 *  al refrescar (bala 4, Manuel: avisar y actualizar); se limpia con «Entendido». */
export interface CartLine { id: string; qty: number; priceAtAdd: number | null; fromApi?: boolean; changedFrom?: number | null;
  /** Bala 12: la imagen de tienda (primera de «foto») guardada al agregar; sin ella, la línea usa la foto técnica del modelo. */
  imagen?: string | null;
  /** Modelo y nombre guardados al agregar. La lista de productos que viaja con la tienda es una foto de cuando se generó: un producto
   *  publicado después solo existe en la API, y sin esto la línea no tendría con qué pintarse. */
  model?: string; name?: string; }

/** Carrito en signals; persiste en localStorage solo en navegador (SSR-safe). El CP y el envío resuelto viven en sessionStorage. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private products = inject(ProductService);
  private api = inject(StorefrontApi);
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly lines = signal<CartLine[]>(this.load());
  /** Código postal de envío (bala 4): se pide en el carrito, antes del login y del pago. */
  readonly cp = signal<string>(this.loadSession('bsv.cp') ?? '');
  readonly shippingResult = signal<ShippingResponse | null>(null);
  readonly shippingLoading = signal(false);
  readonly shippingError = signal<string | null>(null);

  readonly count = computed(() => this.lines().reduce((a, l) => a + l.qty, 0));
  /** Precio unitario de una línea: el que traía al agregar (API) y, si no, el del catálogo local. */
  unitPrice(l: CartLine): number | null { return l.fromApi ? l.priceAtAdd : (this.products.byId(l.id)?.price ?? l.priceAtAdd ?? null); }
  /** Resolución de envío de una línea, si ya se calculó. */
  shippingOf(l: CartLine): ShippingLine | null { return this.shippingResult()?.lineas.find(x => x.slug === l.id) ?? null; }
  /** Una línea entra al total si tiene precio y no quedó «por cotizar» tras resolver el envío. */
  private billable(l: CartLine) { const s = this.shippingOf(l); return this.unitPrice(l) != null && (s == null || s.estado === 'carrito'); }
  readonly total = computed(() => this.lines().reduce((a, l) => a + (this.billable(l) ? l.qty * (this.unitPrice(l) ?? 0) : 0), 0));
  readonly base = computed(() => this.total() / (1 + IVA));
  readonly iva = computed(() => this.total() - this.base());
  /** Envío: lo que dijo el back-office para este CP (`null` = por confirmar); sin CP, se desconoce. */
  readonly shipping = computed<number | null>(() => this.shippingResult()?.costoEnvio ?? null);
  readonly hasUnpriced = computed(() => this.lines().some(l => this.unitPrice(l) == null));
  readonly hasQuoteOnly = computed(() => this.lines().some(l => this.shippingOf(l)?.estado === 'cotizar'));
  readonly changed = computed(() => this.lines().filter(l => l.changedFrom != null));
  /** Líneas que van al pedido (bala 5): con precio y no «por cotizar». Las parciales van completas; el backend las parte. */
  readonly checkoutLines = computed(() => this.lines().filter(l => this.billable(l)));
  readonly canCheckout = computed(() => this.checkoutLines().length > 0);
  /** Cupones aplicados (bala 5; varios desde nov-2026), en el orden en que se pusieron: se aplican en cascada. Se validan contra el
   *  backend; el pedido los vuelve a validar al crearse. */
  readonly couponCodes = signal<string[]>(this.loadCoupons());
  /** Los códigos juntos, para mostrarlos en una línea. */
  readonly couponCode = computed(() => this.couponCodes().join(' + '));
  readonly coupon = signal<CouponResponse | null>(null);
  /** Lo último que pasó al aplicar: por qué un cupón no entró, o que la tienda topó el descuento. */
  readonly couponNotice = signal<string | null>(null);
  /** Con cupón válido, los totales son los del backend (descuento antes de IVA); sin cupón, los locales. */
  /** La compra mínima en línea de la tienda, que llega con el envío; nulo = sin mínimo (o aún sin cotizar el envío). */
  readonly minPurchase = computed<number | null>(() => this.shippingResult()?.compraMinima ?? null);
  /** Lo que falta en productos para alcanzar la compra mínima; 0 si ya se alcanza o no hay mínimo. */
  readonly missingForMinimum = computed(() => { const m = this.minPurchase(); return m == null ? 0 : Math.max(0, Math.round((m - this.totalWithCoupon()) * 100) / 100); });
  readonly totalWithCoupon = computed(() => { const c = this.coupon(); return c?.valido ? c.total : this.total(); });
  readonly ivaWithCoupon = computed(() => { const c = this.coupon(); return c?.valido && c.iva != null ? c.iva : this.iva(); });
  readonly priceChanged = computed(() => this.changed()[0] ?? null);

  constructor() {
    effect(() => { if (this.browser) localStorage.setItem('bsv.cart', JSON.stringify(this.lines())); });
    effect(() => { if (this.browser) { const cp = this.cp(); if (cp) sessionStorage.setItem('bsv.cp', cp); else sessionStorage.removeItem('bsv.cp'); } });
    effect(() => { if (this.browser) { const c = this.couponCodes(); if (c.length) sessionStorage.setItem('bsv.cupones', JSON.stringify(c)); else sessionStorage.removeItem('bsv.cupones'); } });
  }

  /** Lo que el carrito y el pago pintan de una línea: lo guardado al agregar y, si falta, la lista local; nunca queda sin modelo. */
  view(l: Pick<CartLine, 'id' | 'model' | 'name'>): { model: string; name: string; catalog: string | null } {
    const p = this.products.byId(l.id);
    return { model: l.model ?? p?.model ?? l.id.toUpperCase(), name: l.name ?? p?.name ?? '', catalog: p?.catalog ?? null };
  }

  /** `info`: modelo y nombre tal como los muestra la ficha. Devuelve si la línea entró (un id desconocido y sin `info` no entra). */
  add(id: string, qty = 1, price: number | null = null, imagen: string | null = null, info: { model: string; name: string } | null = null): boolean {
    if (!info && !this.products.byId(id)) return false;
    const fromApi = price != null;
    this.lines.update(ls => { const l = ls.find(x => x.id === id); return l ? ls.map(x => x.id === id ? { ...x, qty: x.qty + qty, ...(fromApi ? { priceAtAdd: price, fromApi } : {}), ...(imagen ? { imagen } : {}), ...(info ?? {}) } : x) : [...ls, { id, qty, priceAtAdd: fromApi ? price : (this.products.byId(id)?.price ?? null), ...(fromApi ? { fromApi } : {}), ...(imagen ? { imagen } : {}), ...(info ?? {}) }]; });
    this.shippingResult.set(null);
    return true;
  }
  setQty(id: string, qty: number) { this.lines.update(ls => ls.map(x => x.id === id ? { ...x, qty } : x).filter(x => x.qty > 0)); this.shippingResult.set(null); }
  remove(id: string) { this.lines.update(ls => ls.filter(x => x.id !== id)); this.shippingResult.set(null); }
  clear() { this.lines.set([]); this.shippingResult.set(null); this.coupon.set(null); this.couponCodes.set([]); this.couponNotice.set(null); }
  /** El backend rechazó el pedido con 409 PRECIO_CAMBIO: aplica los precios nuevos y marca las líneas para avisar. */
  applyPriceChanges(cambios: { slug: string; precioActual?: number }[]) {
    this.lines.update(ls => ls.map(l => { const c = cambios.find(x => x.slug === l.id); if (!c || c.precioActual == null || c.precioActual === l.priceAtAdd) return l; return { ...l, priceAtAdd: c.precioActual, fromApi: true, changedFrom: l.priceAtAdd }; }));
  }
  /** Agrega un cupón a los ya aplicados y los valida todos. @returns si el cupón entró */
  async applyCoupon(code: string): Promise<boolean> {
    const codigo = code.trim().toUpperCase();
    if (!codigo) return false;
    if (this.couponCodes().includes(codigo)) { this.couponNotice.set(`El cupón ${codigo} ya está aplicado.`); return false; }
    await this.validateCoupons([...this.couponCodes(), codigo]);
    return this.couponCodes().includes(codigo);
  }
  async removeCoupon(code: string) { this.couponNotice.set(null); await this.validateCoupons(this.couponCodes().filter(c => c !== code)); }
  /** Vuelve a validar los cupones guardados (al entrar al pago, o si cambió el carrito). */
  revalidateCoupons() { return this.validateCoupons(this.couponCodes()); }

  /**
   * Valida la lista completa contra el backend. Los que no entran se QUITAN de la lista y se dice por qué: lo que el comprador ve
   * aplicado es exactamente lo que el pedido va a llevar (el backend rechaza un pedido con un cupón que no entra, no lo corrige).
   */
  private async validateCoupons(codes: string[]) {
    this.couponNotice.set(null);
    if (!codes.length) { this.couponCodes.set([]); this.coupon.set(null); return; }
    const lineas = this.checkoutLines().map(l => ({ slug: l.id, cantidad: l.qty }));
    try {
      let r = await this.api.coupon(codes, lineas);
      const items = r.cupones ?? codes.map(c => ({ codigo: c, valido: r.valido, motivo: r.motivo, descuento: r.valido ? r.descuento : 0 }));
      const fuera = items.filter(i => !i.valido);
      const dentro = items.filter(i => i.valido).map(i => i.codigo);
      if (fuera.length) {
        this.couponNotice.set(fuera.map(i => !i.motivo || i.motivo === 'no válido' ? `El cupón ${i.codigo} no es válido.` : `${i.codigo}: ${i.motivo}`).join(' '));
        r = dentro.length ? await this.api.coupon(dentro, lineas) : { ...r, valido: false, descuento: 0, cupones: [] };
      } else if (r.topeAplicado) {
        this.couponNotice.set('Alcanzaste el descuento máximo por cupones: el último se aplicó en parte.');
      }
      this.couponCodes.set(dentro); this.coupon.set(dentro.length ? r : null);
    } catch {
      // Sin respuesta no se sabe qué vale: se conserva la lista, sin descuento, y se avisa. El pedido los valida de todos modos.
      this.couponCodes.set(codes); this.coupon.set(null); this.couponNotice.set('No pudimos validar los cupones. Intenta de nuevo.');
    }
  }
  /** Lo que descontó cada cupón aplicado, para el resumen. */
  readonly couponItems = computed(() => (this.coupon()?.cupones ?? []).filter(i => i.valido));
  acknowledgePrices() { this.lines.update(ls => ls.map(l => ({ ...l, changedFrom: undefined }))); }

  /** Refresca el precio de cada línea desde la API (bala 4): si cambió, se actualiza y se marca para avisar. */
  async refreshPrices() {
    if (!this.browser || !this.lines().length) return;
    const fresh = await Promise.all(this.lines().map(async l => {
      try { const r = await fetch(`/api/tienda/v1/productos/${encodeURIComponent(l.id)}`); if (!r.ok) return null; return (await r.json() as { price: { amount: number } | null }).price?.amount ?? null; } catch { return null; }
    }));
    this.lines.update(ls => ls.map((l, i) => { const now = fresh[i]; if (now == null || l.priceAtAdd === now) return l; return { ...l, priceAtAdd: now, fromApi: true, changedFrom: l.priceAtAdd }; }));
  }

  /** Resuelve el envío para el CP actual. Nunca bloquea: una línea sin existencia queda «por cotizar». */
  async resolveShipping() {
    const cp = this.cp().trim();
    if (!/^\d{5}$/.test(cp)) { this.shippingError.set('Escribe un código postal de 5 dígitos.'); return; }
    this.shippingError.set(null); this.shippingLoading.set(true);
    try { this.shippingResult.set(await this.api.shipping(cp, this.lines().map(l => ({ slug: l.id, cantidad: l.qty })))); }
    catch { this.shippingError.set('No pudimos calcular el envío. Intenta de nuevo.'); }
    finally { this.shippingLoading.set(false); }
  }


  private load(): CartLine[] { if (!this.browser) return []; try { return JSON.parse(localStorage.getItem('bsv.cart') || '[]'); } catch { return []; } }
  /** Los cupones de la sesión; lee también la clave anterior, de cuando era uno solo. */
  private loadCoupons(): string[] {
    try { const many = JSON.parse(this.loadSession('bsv.cupones') ?? 'null'); if (Array.isArray(many)) return many.filter(c => typeof c === 'string' && c); } catch { /* cae al valor viejo */ }
    const one = this.loadSession('bsv.cupon'); return one ? [one] : [];
  }
  private loadSession(k: string): string | null { if (!this.browser) return null; try { return sessionStorage.getItem(k); } catch { return null; } }
}
