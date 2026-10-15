import { Injectable, signal, computed, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProductService, IVA } from './products';

/** `fromApi`: el precio vino de la API de tienda al agregar (bala 1); mientras el catálogo local siga con precios de demo, esas líneas no se comparan contra él. */
export interface CartLine { id: string; qty: number; priceAtAdd: number | null; fromApi?: boolean; }

/** Carrito en signals; persiste en localStorage solo en navegador (SSR-safe). */
@Injectable({ providedIn: 'root' })
export class CartService {
  private products = inject(ProductService);
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly lines = signal<CartLine[]>(this.load());

  readonly count = computed(() => this.lines().reduce((a, l) => a + l.qty, 0));
  /** Precio unitario de una línea: el que traía al agregar (API) y, si no, el del catálogo local. */
  unitPrice(l: CartLine): number | null { return l.fromApi ? l.priceAtAdd : (this.products.byId(l.id)?.price ?? l.priceAtAdd ?? null); }
  readonly total = computed(() => this.lines().reduce((a, l) => a + l.qty * (this.unitPrice(l) ?? 0), 0));
  readonly base = computed(() => this.total() / (1 + IVA));
  readonly iva = computed(() => this.total() - this.base());
  readonly shipping = computed(() => this.total() >= 5000 ? 0 : 250);
  readonly hasUnpriced = computed(() => this.lines().some(l => this.unitPrice(l) == null));
  readonly priceChanged = computed(() => this.lines().find(l => { if (l.fromApi) return false; const p = this.products.byId(l.id)?.price; return p != null && l.priceAtAdd != null && l.priceAtAdd !== p; }) ?? null);

  constructor() { effect(() => { if (this.browser) localStorage.setItem('bsv.cart', JSON.stringify(this.lines())); }); }

  add(id: string, qty = 1, price: number | null = null) {
    const p = this.products.byId(id); if (!p) return;
    const fromApi = price != null;
    this.lines.update(ls => { const l = ls.find(x => x.id === id); return l ? ls.map(x => x.id === id ? { ...x, qty: x.qty + qty, ...(fromApi ? { priceAtAdd: price, fromApi } : {}) } : x) : [...ls, { id, qty, priceAtAdd: fromApi ? price : p.price, ...(fromApi ? { fromApi } : {}) }]; });
  }
  setQty(id: string, qty: number) { this.lines.update(ls => ls.map(x => x.id === id ? { ...x, qty } : x).filter(x => x.qty > 0)); }
  remove(id: string) { this.lines.update(ls => ls.filter(x => x.id !== id)); }
  clear() { this.lines.set([]); }
  acknowledgePrices() { this.lines.update(ls => ls.map(l => ({ ...l, priceAtAdd: this.products.byId(l.id)?.price ?? null }))); }
  /** Solo para la demo: llena el carrito con un caso de precio cambiado. */
  /** Demo del flujo: dos modelos reales del catálogo (sin precios). */
  demo() { if (this.count()) return; this.add('2cp-32-210a', 1); this.add('pk-60', 2); }

  private load(): CartLine[] { if (!this.browser) return []; try { return JSON.parse(localStorage.getItem('bsv.cart') || '[]'); } catch { return []; } }
}
