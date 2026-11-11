/** La URL de pago de Mercado Pago de un pedido, recordada en la pestaña (bala 13): la usa `/checkout/confirmando` si el comprador vuelve sin pagar. */
export const rememberPayUrl = (folio: string, url: string) => { try { sessionStorage.setItem('bsv.pago.' + folio, url); } catch { /* sin almacenamiento */ } };
export const payUrlOf = (folio: string): string | null => { try { return sessionStorage.getItem('bsv.pago.' + folio); } catch { return null; } };
