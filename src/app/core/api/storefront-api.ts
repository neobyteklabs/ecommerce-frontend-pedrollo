import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient, HttpInterceptorFn, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/** Base de la API de tienda. En el navegador es '' (mismo origen: server.ts hace de proxy y pone la llave);
 *  en SSR la config de servidor la sobreescribe con BACKOFFICE_URL (absoluta, no hay origen relativo). */
export const API_BASE = new InjectionToken<string>('API_BASE', { providedIn: 'root', factory: () => '' });
/** Llave de tienda (X-Store-Key). SOLO la provee la config de servidor desde process.env; en el navegador es ''. */
export const STORE_KEY = new InjectionToken<string>('STORE_KEY', { providedIn: 'root', factory: () => '' });

/** Contrato §3.6 del hand-off de backend (bala 1) + llave de tienda (bala 1b). Identificadores en inglés, valores en español. */
export interface StorefrontPrice {
  amount: number; currency: 'MXN'; taxIncluded: boolean; net: number; tax: number; calculatedAt: string;
  /** Solo si hay promoción vigente (bala 3): precio con IVA antes de la promoción, para el tachado. */
  before?: number; promotion?: { label: string; until: string };
}
/** Disponibilidad (bala 4): dos estados; `carrito` = hay existencia en algún CEDIS, `cotizar` = no hay, se pide cotización. */
export interface StorefrontAvailability { state: 'carrito' | 'cotizar'; }
/** Envío por código postal (bala 4): el back-office resuelve por línea de qué CEDIS sale y cuánto tarda; nunca bloquea. */
export interface ShippingLine { slug: string; estado: 'carrito' | 'cotizar'; parcial: boolean; cedis: string | null; dias: number | null; costoEnvio: number | null; solicitado: number; disponible: number; }
export interface ShippingResponse { zona: string | null; zonaNombre: string | null; lineas: ShippingLine[]; costoEnvio: number | null; costoPorConfirmar: boolean; }
/** «Cotizar» (bala 4): llega al CRM como lead; nombre y al menos correo o teléfono son obligatorios. */
export interface QuoteRequest { slug: string; cantidad: number; nombre: string; correo?: string; telefono?: string; cp?: string; mensaje?: string; }
export interface QuoteResponse { folio: string; }
/** Listados (bala F1). Identificadores en inglés, valores en español tal como vienen del catálogo. */
export interface StorefrontFamily { slug: string; name: string; count: number; }
export interface StorefrontSeries { slug: string; name: string; familySlug: string; count: number; }
export interface StorefrontProductSummary {
  slug: string; catalogProductId: number; model: string; family: string | null; familySlug: string | null;
  series: string | null; seriesSlug: string | null; price: StorefrontPrice | null; availability: StorefrontAvailability | null;
  hp: string | null; phase: string | null; voltage: string | null; imageKey: string | null;
}
export interface StorefrontPage { content: StorefrontProductSummary[]; totalElements: number; totalPages: number; number: number; size: number; }
export interface FacetValue { value: string; count: number; }
export interface StorefrontFacets { hp: FacetValue[]; tension: FacetValue[]; fase: FacetValue[]; }
export type ListingOrder = 'serie' | 'hp-asc' | 'hp-desc' | 'precio-asc' | 'precio-desc';
export interface ListingParams { familia?: string; serie?: string; q?: string; hp?: string; tension?: string; fase?: string; orden?: ListingOrder; page?: number; size?: number; }
export interface StorefrontProduct {
  slug: string; catalogProductId: number; model: string; family: string; subtype: string | null; series: string | null;
  supplier: { id: number | null; slug: string | null }; price: StorefrontPrice | null; availability: StorefrontAvailability | null;
  attributes: Record<string, unknown>; sectionNote: string | null; description: string | null; imageKey: string | null; fichaKey: string | null;
}

/** Bala 5: cupón, pedido, pago y seguimiento (contrato §5 del hand-off de backend bala 5). */
export interface CouponResponse { valido: boolean; motivo?: string | null; descuento: number; subtotal: number; iva?: number; total: number; }
export interface OrderBuyer { nombre: string; correo: string; telefono: string; empresa?: string; }
export interface OrderAddress { cp: string; calle: string; numeroExt: string; numeroInt?: string; colonia: string; municipio: string; estado: string; referencias?: string; }
export interface OrderRequest { comprador: OrderBuyer; entrega: OrderAddress; lineas: { slug: string; cantidad: number; precioEsperado: number }[]; cupon?: string; }
export interface OrderCreated { folio: string; numero: string; total: number; expira: string; pago: { modo: 'stripe' | 'simulado'; referencia: string; clientSecret?: string | null }; }
export interface OrderConfirm { folio: string; numero: string; estado: 'pagado' | 'pendiente_pago' | 'expirado' | 'cancelado'; }
export interface OrderLineView { modelo: string; descripcion: string; cantidad: number; precioUnitario: number; importe: number; cedis: string | null; sobrePedido: boolean; diasEstimados: number | null; }
export interface OrderView {
  folio: string; numero: string; estado: string; moneda: string; subtotal: number; descuentoCupon: number; cuponCodigo: string | null; iva: number; envio: number; total: number;
  comprador: OrderBuyer; entrega: OrderAddress; renglones: OrderLineView[]; pago: { modo: string; estado: string } | null; creado: string;
}
/** Error 409 al crear el pedido: el precio cambió o no hay existencia para alguna línea. */
export interface OrderConflict { code: 'PRECIO_CAMBIO' | 'SIN_EXISTENCIA' | string; lineas?: { slug: string; precioAnterior?: number; precioActual?: number; disponible?: number }[]; }
export type TrackingState = 'recibida' | 'lista' | 'vencida' | 'pedido_recibido' | 'preparando' | 'en_camino' | 'en_reparto' | 'entregado' | 'cerrada';
/** Bala 5d: `modo` `reparto` = lo lleva un repartidor de la tienda (sin guía); `remisionUrl` es la nota de remisión, firmada tras entregar. */
export interface TrackingShipment { id?: number; origen: string; modo?: 'paqueteria' | 'reparto' | null; paqueteria: string | null; guia: string | null; urlRastreo: string | null; fechaEstimada: string | null; enRepartoDesde?: string | null; entregadoEn: string | null; recibio?: string | null; remisionUrl?: string | null; renglones: { modelo: string; cantidad: number }[]; }
export interface TrackingResponse {
  folio: string; tipo: 'pedido' | 'cotizacion'; estado: TrackingState; titulo: string; detalle: string; actualizado: string | null; obsoleto?: boolean;
  entregadoEn?: string | null; recibio?: string | null;
  asesor?: { nombre: string; telefono: string | null; whatsapp: string | null } | null;
  pedido?: { numero: string; total: number; moneda: string; renglones: { modelo: string; cantidad: number }[] } | null;
  cotizacion?: { folio: string; total: number; moneda: string; vigencia: string | null; documento: string | null } | null;
  envios: TrackingShipment[]; acciones: string[];
}

/** Añade X-Store-Key solo cuando hay llave (SSR) y la petición va al back-office. En el bundle del navegador STORE_KEY es '' y no hace nada. */
export const storeKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const key = inject(STORE_KEY); const base = inject(API_BASE);
  return key && base && req.url.startsWith(base) ? next(req.clone({ setHeaders: { 'X-Store-Key': key } })) : next(req);
};

@Injectable({ providedIn: 'root' })
export class StorefrontApi {
  private base = inject(API_BASE);
  private http = inject(HttpClient);
  /** Resuelve envío por CP para las líneas del carrito. POST sin caché; va por el proxy como todo lo demás. */
  shipping(cp: string, lineas: { slug: string; cantidad: number }[]) {
    return firstValueFrom(this.http.post<ShippingResponse>(`${this.base}/api/tienda/v1/carrito/envio`, { cp, lineas }));
  }
  /** Pide una cotización. `idempotencyKey` es un UUID por intento del usuario: un doble clic no crea dos leads. */
  quote(body: QuoteRequest, idempotencyKey: string) {
    return firstValueFrom(this.http.post<QuoteResponse>(`${this.base}/api/tienda/v1/cotizaciones`, body, { headers: { 'Idempotency-Key': idempotencyKey } }));
  }
  /** Valida un cupón contra las líneas del carrito (bala 5). Nunca dice si el código existe. */
  coupon(codigo: string, lineas: { slug: string; cantidad: number }[]) {
    return firstValueFrom(this.http.post<CouponResponse>(`${this.base}/api/tienda/v1/carrito/cupon`, { codigo, lineas }));
  }
  /** Crea el pedido pendiente de pago (snapshot + reserva). 409 si el precio cambió o no hay existencia. */
  createOrder(body: OrderRequest) { return firstValueFrom(this.http.post<OrderCreated>(`${this.base}/api/tienda/v1/pedidos`, body)); }
  /** Confirma el pago consultando la pasarela; idempotente. */
  confirmOrder(folio: string) { return firstValueFrom(this.http.post<OrderConfirm>(`${this.base}/api/tienda/v1/pedidos/${encodeURIComponent(folio)}/confirmar`, {})); }
  /** El pedido para la pantalla de gracias; segunda llave = correo o teléfono del comprador. */
  order(folio: string, contacto: string) {
    return firstValueFrom(this.http.get<OrderView>(`${this.base}/api/tienda/v1/pedidos/${encodeURIComponent(folio)}`, { params: { contacto } }));
  }
  /** Seguimiento por folio + contacto (pedido o cotización). `undefined` no pide nada. Debe llamarse en contexto de inyección. */
  tracking(key: () => { folio: string; contacto: string } | undefined) {
    return httpResource<TrackingResponse>(() => { const k = key(); return k ? { url: `${this.base}/api/tienda/v1/seguimiento/${encodeURIComponent(k.folio)}`, params: { contacto: k.contacto } } : undefined; });
  }
  /** La ficha pública. Debe llamarse en contexto de inyección (campo de componente). */
  product(slug: () => string) {
    return httpResource<StorefrontProduct>(() => `${this.base}/api/tienda/v1/productos/${encodeURIComponent(slug())}`);
  }
  /** Familias visibles con conteo. */
  families() { return httpResource<StorefrontFamily[]>(() => `${this.base}/api/tienda/v1/familias`); }
  /** Series de una familia (slug). `undefined` no pide nada. */
  series(familia: () => string | undefined) {
    return httpResource<StorefrontSeries[]>(() => { const f = familia(); return f ? { url: `${this.base}/api/tienda/v1/series`, params: { familia: f } } : undefined; });
  }
  /** Listado con filtros, orden y paginación. `undefined` no pide nada (p. ej. búsqueda sin término). */
  products(params: () => ListingParams | undefined) {
    return httpResource<StorefrontPage>(() => { const q = params(); return q ? { url: `${this.base}/api/tienda/v1/productos`, params: clean(q) } : undefined; });
  }
  /** Facetas (conteos por HP, tensión y fase) del conjunto familia/serie/q. */
  facets(params: () => Pick<ListingParams, 'familia' | 'serie' | 'q'> | undefined) {
    return httpResource<StorefrontFacets>(() => { const q = params(); return q ? { url: `${this.base}/api/tienda/v1/productos/facetas`, params: clean(q) } : undefined; });
  }
}

/** Quita claves vacías: la API trata `hp=` como filtro y un parámetro ausente como «sin filtro». */
function clean(q: object): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(q)) { if (v !== undefined && v !== null && v !== '') out[k] = v as string | number; }
  return out;
}
