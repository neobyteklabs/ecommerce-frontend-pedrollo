import { Injectable, signal, computed, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProductService, IVA } from './products';
import { StorefrontApi, ShippingResponse, ShippingLine, CouponResponse } from './api/storefront-api';

/** `fromApi`: el precio vino de la API de tienda al agregar. `changedFrom`: el precio anterior cuando la API devolvió otro
 *  al refrescar (bala 4, Manuel: avisar y actualizar); se limpia con «Entendido». */
export interface CartLine { id: string; qty: number; priceAtAdd: number | null; fromApi?: boolean; changedFrom?: number | null; }

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
  /** Cupón aplicado en el carrito/checkout (bala 5). Se valida contra el backend; el pedido lo vuelve a validar al crearse. */
  readonly couponCode = signal<string>(this.loadSession('bsv.cupon') ?? '');
  readonly coupon = signal<CouponResponse | null>(null);
  readonly totalWithCoupon = computed(() => { const c = this.coupon(); return c?.valido ? Math.max(0, this.total() - c.descuento) : this.total(); });
  readonly priceChanged = computed(() => this.changed()[0] ?? null);

  constructor() {
    effect(() => { if (this.browser) localStorage.setItem('bsv.cart', JSON.stringify(this.lines())); });
    effect(() => { if (this.browser) { const cp = this.cp(); if (cp) sessionStorage.setItem('bsv.cp', cp); else sessionStorage.removeItem('bsv.cp'); } });
    effect(() => { if (this.browser) { const c = this.couponCode(); if (c) sessionStorage.setItem('bsv.cupon', c); else sessionStorage.removeItem('bsv.cupon'); } });
  }

  add(id: string, qty = 1, price: number | null = null) {
    const p = this.products.byId(id); if (!p) return;
    const fromApi = price != null;
    this.lines.update(ls => { const l = ls.find(x => x.id === id); return l ? ls.map(x => x.id === id ? { ...x, qty: x.qty + qty, ...(fromApi ? { priceAtAdd: price, fromApi } : {}) } : x) : [...ls, { id, qty, priceAtAdd: fromApi ? price : p.price, ...(fromApi ? { fromApi } : {}) }]; });
    this.shippingResult.set(null);
  }
  setQty(id: string, qty: number) { this.lines.update(ls => ls.map(x => x.id === id ? { ...x, qty } : x).filter(x => x.qty > 0)); this.shippingResult.set(null); }
  remove(id: string) { this.lines.update(ls => ls.filter(x => x.id !== id)); this.shippingResult.set(null); }
  clear() { this.lines.set([]); this.shippingResult.set(null); this.coupon.set(null); this.couponCode.set(''); }
  /** El backend rechazó el pedido con 409 PRECIO_CAMBIO: aplica los precios nuevos y marca las líneas para avisar. */
  applyPriceChanges(cambios: { slug: string; precioActual?: number }[]) {
    this.lines.update(ls => ls.map(l => { const c = cambios.find(x => x.slug === l.id); if (!c || c.precioActual == null || c.precioActual === l.priceAtAdd) return l; return { ...l, priceAtAdd: c.precioActual, fromApi: true, changedFrom: l.priceAtAdd }; }));
  }
  /** Valida el cupón contra las líneas del pedido. Con código vacío, lo quita. */
  async applyCoupon(code: string) {
    const codigo = code.trim().toUpperCase(); this.couponCode.set(codigo);
    if (!codigo) { this.coupon.set(null); return null; }
    try { const r = await this.api.coupon(codigo, this.checkoutLines().map(l => ({ slug: l.id, cantidad: l.qty }))); this.coupon.set(r); return r; }
    catch { const r: CouponResponse = { valido: false, motivo: 'No pudimos validar el cupón. Intenta de nuevo.', descuento: 0, subtotal: this.base(), total: this.total() }; this.coupon.set(r); return r; }
  }
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

  /** Demo del flujo: dos modelos reales del catálogo. */
  demo() { if (this.count()) return; this.add('2cp-32-210a', 1); this.add('pk-60', 2); }

  private load(): CartLine[] { if (!this.browser) return []; try { return JSON.parse(localStorage.getItem('bsv.cart') || '[]'); } catch { return []; } }
  private loadSession(k: string): string | null { if (!this.browser) return null; try { return sessionStorage.getItem(k); } catch { return null; } }
}
