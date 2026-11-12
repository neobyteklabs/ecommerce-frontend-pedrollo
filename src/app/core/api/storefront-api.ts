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
export interface StorefrontAvailability { state: 'carrito' | 'cotizar'; reason?: 'solo-cotizacion' | 'sin-existencia'; }
/** Envío por código postal (bala 4): el back-office resuelve por línea de qué CEDIS sale y cuánto tarda; nunca bloquea. */
export interface ShippingLine { slug: string; estado: 'carrito' | 'cotizar'; parcial: boolean; cedis: string | null; dias: number | null; costoEnvio: number | null; solicitado: number; disponible: number; }
export interface ShippingResponse { zona: string | null; zonaNombre: string | null; lineas: ShippingLine[]; costoEnvio: number | null; costoPorConfirmar: boolean; }
/** «Cotizar» (bala 4): llega al CRM como lead; nombre y al menos correo o teléfono son obligatorios. */
export interface QuoteRequest { slug: string; cantidad: number; nombre: string; correo?: string; telefono?: string; cp?: string; mensaje?: string; entrega?: OrderAddress; }
/** `numero` (`COT-000015`) es lo que se le enseña al comprador; `folio` es el UUID interno, que el seguimiento también acepta. */
export interface QuoteResponse { folio: string; numero: string; }
/** Listados (bala F1). Identificadores en inglés, valores en español tal como vienen del catálogo. */
export interface StorefrontFamily { slug: string; name: string; count: number; }
export interface StorefrontSeries { slug: string; name: string; familySlug: string; count: number; }
export interface StorefrontProductSummary {
  slug: string; catalogProductId: number; model: string; family: string | null; familySlug: string | null;
  series: string | null; seriesSlug: string | null; price: StorefrontPrice | null; availability: StorefrontAvailability | null;
  hp: string | null; phase: string | null; voltage: string | null; imageKey: string | null;
  /** Bala 11: URL de la primera imagen estilizada de la tienda (relativa `/media/…` o absoluta del CDN); `null` = la técnica / el manifiesto. */
  imagen: string | null;
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
  /** Bala 11: imágenes estilizadas de la tienda, en el orden del admin; pueden ser `[]`. */
  imagenes: StoreImage[];
  /** Bala 12: PDF de la tienda para este producto (ficha técnica, curvas, manual…), en el orden del admin; pueden ser `[]`. */
  documentos: StoreDocument[];
}
/** Bala 12: la sección de la ficha (sus pestañas) a la que pertenece una imagen de tienda. */
export type GallerySection = 'foto' | 'curvas' | 'componentes' | 'ficha';
export interface StoreImage { url: string; alt: string; seccion: GallerySection; }
export type DocumentType = 'ficha-tecnica' | 'curvas' | 'manual' | 'despiece' | 'certificado' | 'otro';
export interface StoreDocument { url: string; tipo: DocumentType; titulo: string; bytes: number; }
/** Bala 11: un banner de tienda. La imagen completa + alt + enlace opcional (ruta de la tienda `/…` o `https://…`); la tienda no pinta texto encima. */
export interface StoreBanner { url: string; urlMovil: string | null; alt: string; enlace: string | null; }
export interface StoreBanners { hero: StoreBanner[]; franja: StoreBanner[]; 'banner-marca': StoreBanner[]; categoria: Record<string, StoreBanner[]>; }

/** Bala 5: cupón, pedido, pago y seguimiento (contrato §5 del hand-off de backend bala 5). */
export interface CouponResponse { valido: boolean; motivo?: string | null; descuento: number; subtotal: number; iva?: number; total: number; }
export interface OrderBuyer { nombre: string; correo: string; telefono: string; empresa?: string; }
export interface OrderAddress { cp: string; calle: string; numeroExt: string; numeroInt?: string; colonia: string; municipio: string; estado: string; referencias?: string; }
export interface OrderRequest { comprador: OrderBuyer; entrega: OrderAddress; lineas: { slug: string; cantidad: number; precioEsperado: number }[]; cupon?: string; }
export interface OrderCreated { folio: string; numero: string; total: number; expira: string; pago: { modo: 'mercadopago-tarjeta' | 'mercadopago' | 'stripe' | 'simulado'; referencia: string; clientSecret?: string | null; /** Bala 13: con Mercado Pago, el checkout al que se redirige al comprador. */ urlPago?: string | null }; }
/** Bala 13: lo que entrega el formulario de tarjeta de Mercado Pago (un token de un uso, nunca el número) y lo que contesta el backend. */
export interface CardPaymentRequest { token: string; paymentMethodId: string; paymentType?: string; installments?: number; email?: string; }
export interface CardPaymentResult { folio: string; numero: string; estado: 'pagado' | 'pendiente_pago'; pago: 'aprobado' | 'rechazado' | 'pendiente'; detalle: string | null; }
export interface OrderConfirm { folio: string; numero: string; estado: 'pagado' | 'pendiente_pago' | 'expirado' | 'cancelado'; }
export interface OrderLineView { modelo: string; descripcion: string; cantidad: number; precioUnitario: number; importe: number; cedis: string | null; sobrePedido: boolean; diasEstimados: number | null; }
export interface OrderView {
  folio: string; numero: string; estado: string; moneda: string; subtotal: number; descuentoCupon: number; cuponCodigo: string | null; iva: number; envio: number; total: number;
  comprador: OrderBuyer; entrega: OrderAddress; renglones: OrderLineView[]; pago: { modo: string; estado: string } | null; creado: string;
}
/** Error 409 al crear el pedido: el precio cambió o no hay existencia para alguna línea. */
export interface OrderConflict { code: 'PRECIO_CAMBIO' | 'SIN_EXISTENCIA' | string; lineas?: { slug: string; precioAnterior?: number; precioActual?: number; disponible?: number }[]; }
export type TrackingState = 'recibida' | 'lista' | 'vencida' | 'aceptada' | 'pedido_recibido' | 'preparando' | 'en_camino' | 'en_reparto' | 'entregado' | 'cerrada';
/** Bala 5d: `modo` `reparto` = lo lleva un repartidor de la tienda (sin guía); `remisionUrl` es la nota de remisión, firmada tras entregar. */
export interface TrackingShipment { id?: number; origen: string; modo?: 'paqueteria' | 'reparto' | null; paqueteria: string | null; guia: string | null; urlRastreo: string | null; fechaEstimada: string | null; enRepartoDesde?: string | null; entregadoEn: string | null; recibio?: string | null; remisionUrl?: string | null; renglones: { modelo: string; cantidad: number }[]; }
export interface TrackingResponse {
  folio: string; numero: string; tipo: 'pedido' | 'cotizacion'; estado: TrackingState; titulo: string; detalle: string; actualizado: string | null; obsoleto?: boolean;
  entregadoEn?: string | null; recibio?: string | null;
  asesor?: { nombre: string; telefono: string | null; whatsapp: string | null } | null;
  pedido?: { numero: string; total: number; moneda: string; renglones: { modelo: string; cantidad: number }[] } | null;
  cotizacion?: { folio: string; total: number; moneda: string; vigencia: string | null; documento: string | null } | null;
  envios: TrackingShipment[]; acciones: string[];
  /** F14: solo viaja (true) en una cotización sin dirección ni en el lead ni guardada: el modal de aceptar la pide. */
  requiereEntrega?: boolean;
  /** Bala 7: la solicitud de factura del pedido, sin datos fiscales. Solo viaja cuando ya se pidió. `acciones` trae `'factura'` si no hay una viva. */
  factura?: { estado: InvoiceState; creado: string; correo: string } | null;
}
/** Bala 7: `solicitada` y `enviada_contabilidad` se ven igual; `sin_contabilidad` = la tienda la guardó pero no salió correo; `rechazada` se puede volver a pedir. */
export type InvoiceState = 'solicitada' | 'enviada_contabilidad' | 'sin_contabilidad' | 'facturada' | 'rechazada';
export interface InvoiceForm { rfc: string; razonSocial: string; regimen: string; cpFiscal: string; usoCfdi: string; correo: string; comentarios?: string; }
export interface InvoiceRequested { estado: InvoiceState; creado: string; yaSolicitada: boolean; }

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
  /** Cobra el pedido con la tarjeta tokenizada (Mercado Pago). Rechazada es una respuesta normal (`pago: 'rechazado'`), no un error. */
  payOrder(folio: string, body: CardPaymentRequest) { return firstValueFrom(this.http.post<CardPaymentResult>(`${this.base}/api/tienda/v1/pedidos/${encodeURIComponent(folio)}/pagar`, body)); }
  confirmOrder(folio: string) { return firstValueFrom(this.http.post<OrderConfirm>(`${this.base}/api/tienda/v1/pedidos/${encodeURIComponent(folio)}/confirmar`, {})); }
  /** El pedido para la pantalla de gracias; segunda llave = correo o teléfono del comprador. */
  order(folio: string, contacto: string) {
    return firstValueFrom(this.http.get<OrderView>(`${this.base}/api/tienda/v1/pedidos/${encodeURIComponent(folio)}`, { params: { contacto } }));
  }
  /** Seguimiento por folio + contacto (pedido o cotización). `undefined` no pide nada. Debe llamarse en contexto de inyección. */
  tracking(key: () => { folio: string; contacto: string } | undefined) {
    return httpResource<TrackingResponse>(() => { const k = key(); return k ? { url: `${this.base}/api/tienda/v1/seguimiento/${encodeURIComponent(k.folio)}`, params: { contacto: k.contacto } } : undefined; });
  }
  /** El comprador acepta su cotización desde la tienda (limpieza pre-bala 6). Idempotente; 409 si venció o no está lista, 503 si el CRM no contestó. */
  acceptQuote(folio: string, contacto: string, entrega?: OrderAddress) {
    return firstValueFrom(this.http.post<TrackingResponse>(`${this.base}/api/tienda/v1/seguimiento/${encodeURIComponent(folio)}/aceptar`, entrega ? { entrega } : {}, { params: { contacto } }));
  }
  /** Bala 7: pide la factura de un pedido pagado. 201 la primera vez, 200 `yaSolicitada` si ya había una viva; 400 con el campo en la primera palabra del `message`; 409 `factura_no_disponible`; 404 opaco. */
  requestInvoice(folio: string, contacto: string, form: InvoiceForm) {
    return firstValueFrom(this.http.post<InvoiceRequested>(`${this.base}/api/tienda/v1/seguimiento/${encodeURIComponent(folio)}/factura`, form, { params: { contacto } }));
  }
  /** La ficha pública. Debe llamarse en contexto de inyección (campo de componente). */
  product(slug: () => string) {
    return httpResource<StorefrontProduct>(() => `${this.base}/api/tienda/v1/productos/${encodeURIComponent(slug())}`);
  }
  /** Bala 11: banners vigentes por hueco. Una llamada por render (el transfer cache de la hidratación evita repetirla en el cliente). */
  banners() { return httpResource<StoreBanners>(() => `${this.base}/api/tienda/v1/banners`); }
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
