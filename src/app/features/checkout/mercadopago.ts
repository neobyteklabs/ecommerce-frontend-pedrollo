import { CardPaymentRequest } from '../../core/api/storefront-api';

/**
 * El formulario de tarjeta de Mercado Pago (Card Payment Brick, bala 13). Los campos de la tarjeta los pinta Mercado Pago dentro de la
 * tienda y viajan directo a sus servidores: la tienda y el backend solo ven el token de un uso que entrega al enviar.
 * El SDK se carga bajo demanda, solo cuando el pedido es de este modo.
 */
const SDK = 'https://sdk.mercadopago.com/js/v2';

interface BrickController { unmount(): void; }
interface BrickForm { token: string; payment_method_id: string; issuer_id?: string; installments?: number; payer?: { email?: string }; }
interface BrickExtra { paymentTypeId?: string; }
interface MercadoPagoSdk { bricks(): { create(brick: string, containerId: string, settings: unknown): Promise<BrickController> }; }
declare global { interface Window { MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoSdk; } }

let loading: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script'); s.src = SDK; s.async = true;
    s.onload = () => resolve(); s.onerror = () => { loading = null; reject(new Error('mercadopago-sdk')); };
    document.head.appendChild(s);
  });
  return loading;
}

/** Lo que el formulario entrega → lo que espera `POST /pedidos/{folio}/pagar`. */
export function toCardPayment(form: BrickForm, extra: BrickExtra | undefined, email: string): CardPaymentRequest {
  return { token: form.token, paymentMethodId: form.payment_method_id, paymentType: extra?.paymentTypeId || 'credit_card', installments: form.installments ?? 1, email: form.payer?.email || email };
}

/** El motivo de rechazo de Mercado Pago, en palabras del comprador. */
export function rejectionMessage(detalle: string | null): { title: string; detail: string } {
  switch (detalle) {
    case 'insufficient_amount': return { title: 'Fondos insuficientes', detail: 'La tarjeta no tiene saldo suficiente. Prueba con otra tarjeta.' };
    case 'amount_limit_exceeded': return { title: 'El monto supera el límite de la tarjeta', detail: 'Prueba con otra tarjeta o pide a tu banco ampliar el límite.' };
    case 'bad_filled_card_data': case 'invalid_card_token': return { title: 'Revisa los datos de la tarjeta', detail: 'Número, vencimiento o código de seguridad no coinciden. Captúralos de nuevo.' };
    case 'required_call_for_authorize': return { title: 'Tu banco pide autorizar la compra', detail: 'Llama a tu banco para autorizar el cargo y vuelve a intentar.' };
    case 'card_disabled': return { title: 'La tarjeta está deshabilitada', detail: 'Actívala con tu banco o usa otra tarjeta.' };
    case 'invalid_installments': return { title: 'Esa tarjeta no acepta esas mensualidades', detail: 'Elige otro plazo o paga en una sola exhibición.' };
    case 'high_risk': return { title: 'No pudimos autorizar este pago', detail: 'Por seguridad el pago no pasó. Prueba con otra tarjeta o escríbenos para pagar por transferencia.' };
    case 'max_attempts_exceeded': return { title: 'Demasiados intentos', detail: 'Espera unos minutos o usa otra tarjeta.' };
    default: return { title: 'Tu banco rechazó el pago', detail: 'No se hizo ningún cargo. Prueba con otra tarjeta o llama a tu banco para autorizar la compra en línea.' };
  }
}

export interface CardBrickOptions {
  containerId: string; publicKey: string; amount: number; email: string;
  /** Devuelve `true` si el pago quedó hecho o en proceso (el formulario se da por terminado) y `false` si fue rechazado (se puede reintentar). */
  onSubmit: (card: CardPaymentRequest) => Promise<boolean>;
  onReady: () => void; onError: () => void;
}

/** Monta el formulario y devuelve cómo desmontarlo. */
export async function mountCardBrick(o: CardBrickOptions): Promise<() => void> {
  await loadSdk();
  const mp = new window.MercadoPago!(o.publicKey, { locale: 'es-MX' });
  const controller = await mp.bricks().create('cardPayment', o.containerId, {
    initialization: { amount: o.amount, payer: { email: o.email } },
    customization: { visual: { hideFormTitle: true, style: { theme: 'default', customVariables: { baseColor: '#0b2b55', borderRadiusMedium: '8px' } } }, paymentMethods: { minInstallments: 1, maxInstallments: 12 } },
    callbacks: {
      onReady: () => o.onReady(),
      onSubmit: (form: BrickForm, extra?: BrickExtra) => o.onSubmit(toCardPayment(form, extra, o.email)).then(ok => { if (!ok) throw new Error('rechazado'); }),
      onError: () => o.onError(),
    },
  });
  return () => { try { controller.unmount(); } catch { /* ya desmontado */ } };
}
