import { describe, expect, it } from 'vitest';
import { rejectionMessage, toCardPayment } from './mercadopago';

/** Bala 13: del formulario de tarjeta de Mercado Pago al backend, y del motivo de rechazo al comprador. */
describe('pago con tarjeta (Mercado Pago)', () => {
  it('manda el token, el medio, el tipo y las mensualidades; nunca datos de la tarjeta', () => {
    const body = toCardPayment({ token: 'tok_1', payment_method_id: 'master', issuer_id: '160', installments: 3, payer: { email: 'a@b.mx' } }, { paymentTypeId: 'debit_card' }, 'otro@b.mx');
    expect(body).toEqual({ token: 'tok_1', paymentMethodId: 'master', paymentType: 'debit_card', installments: 3, email: 'a@b.mx' });
    expect(Object.keys(body)).not.toContain('cardNumber');
  });

  it('sin tipo, mensualidades ni correo del formulario usa crédito, un pago y el correo del pedido', () => {
    expect(toCardPayment({ token: 't', payment_method_id: 'visa' }, undefined, 'pedido@b.mx')).toEqual({ token: 't', paymentMethodId: 'visa', paymentType: 'credit_card', installments: 1, email: 'pedido@b.mx' });
  });

  it('cada motivo de rechazo tiene un mensaje propio y un motivo desconocido cae al genérico', () => {
    expect(rejectionMessage('insufficient_amount').title).toBe('Fondos insuficientes');
    expect(rejectionMessage('bad_filled_card_data').title).toContain('Revisa los datos');
    expect(rejectionMessage('required_call_for_authorize').detail).toContain('Llama a tu banco');
    expect(rejectionMessage('rejected_by_issuer').title).toBe('Tu banco rechazó el pago');
    expect(rejectionMessage(null).detail).toContain('No se hizo ningún cargo');
    expect(rejectionMessage('algo_nuevo').title).toBe('Tu banco rechazó el pago');
  });
});
