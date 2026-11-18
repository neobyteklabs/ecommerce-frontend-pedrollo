import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CartService } from './cart';

/** Compra mínima en línea: la tienda la conoce por la respuesta del envío y avisa cuánto falta antes de intentar el pedido. */
describe('carrito · compra mínima en línea', () => {
  let cart: CartService;
  beforeEach(() => {
    localStorage.clear(); sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    cart = TestBed.inject(CartService);
    cart.lines.set([{ id: 'pk-60', qty: 1, priceAtAdd: 1334, fromApi: true }]);
  });
  const envio = (compraMinima: number | null) => ({ zona: 'cdmx', zonaNombre: 'CDMX', costoEnvio: 150, costoPorConfirmar: false, compraMinima,
    lineas: [{ slug: 'pk-60', estado: 'carrito' }] }) as never;

  it('sin cotizar el envío, o sin mínimo, no falta nada', () => {
    expect(cart.minPurchase()).toBeNull(); expect(cart.missingForMinimum()).toBe(0);
    cart.shippingResult.set(envio(null));
    expect(cart.missingForMinimum()).toBe(0);
  });

  it('dice cuánto falta en productos (el envío no cuenta) y deja de faltar al subir la cantidad', () => {
    cart.shippingResult.set(envio(2000));
    expect(cart.minPurchase()).toBe(2000);
    expect(cart.missingForMinimum()).toBe(666);
    cart.lines.set([{ id: 'pk-60', qty: 2, priceAtAdd: 1334, fromApi: true }]);
    cart.shippingResult.set(envio(2000));
    expect(cart.missingForMinimum()).toBe(0);
  });
});

/** Un producto publicado después de generar la tienda solo existe en la API: tiene que poder comprarse igual. */
describe('carrito · producto que no viaja en la lista local', () => {
  let cart: CartService;
  beforeEach(() => {
    localStorage.clear(); sessionStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    cart = TestBed.inject(CartService);
  });

  it('entra con el modelo y el nombre de la ficha, y el carrito los pinta', () => {
    expect(cart.add('modelo-solo-en-api', 2, 1500, null, { model: 'PKm 60-MD', name: 'Serie PK · Periféricas' })).toBe(true);
    expect(cart.lines()).toEqual([{ id: 'modelo-solo-en-api', qty: 2, priceAtAdd: 1500, fromApi: true, model: 'PKm 60-MD', name: 'Serie PK · Periféricas' }]);
    expect(cart.view(cart.lines()[0])).toEqual({ model: 'PKm 60-MD', name: 'Serie PK · Periféricas', catalog: null });
    expect(cart.total()).toBe(3000);
  });

  it('agregarlo otra vez suma la cantidad', () => {
    cart.add('modelo-solo-en-api', 1, 1500, null, { model: 'PKm 60-MD', name: 'Serie PK' });
    cart.add('modelo-solo-en-api', 2, 1500, null, { model: 'PKm 60-MD', name: 'Serie PK' });
    expect(cart.lines().length).toBe(1); expect(cart.lines()[0].qty).toBe(3);
  });

  it('un id desconocido y sin datos de ficha no entra, y lo dice', () => {
    expect(cart.add('no-existe')).toBe(false); expect(cart.lines()).toEqual([]);
  });

  it('una línea vieja, sin modelo guardado, se pinta con el id y no rompe el carrito', () => {
    expect(cart.view({ id: 'no-existe' })).toEqual({ model: 'NO-EXISTE', name: '', catalog: null });
  });
});

/** Varios cupones: lo que el comprador ve aplicado es exactamente lo que el pedido va a llevar. */
describe('carrito · varios cupones', () => {
  let cart: CartService; let http: HttpTestingController;
  const URL = '/api/tienda/v1/carrito/cupon';
  const flush = async (body: unknown) => { await Promise.resolve(); const r = http.expectOne(q => q.url.endsWith(URL)); r.flush(body as never); return r.request.body as { codigos: string[] }; };
  beforeEach(() => {
    localStorage.clear(); sessionStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    cart = TestBed.inject(CartService); http = TestBed.inject(HttpTestingController);
    cart.lines.set([{ id: 'pk-60', qty: 1, priceAtAdd: 1334, fromApi: true }]);
  });
  afterEach(() => http.verify());

  it('el segundo cupón se suma al primero y se mandan los dos, en orden', async () => {
    const uno = cart.applyCoupon('buen-fin2026');
    expect((await flush({ valido: true, descuento: 57.5, subtotal: 1150, total: 1267.3, cupones: [{ codigo: 'BUEN-FIN2026', valido: true, descuento: 57.5 }] })).codigos).toEqual(['BUEN-FIN2026']);
    expect(await uno).toBe(true);
    const dos = cart.applyCoupon('ClienteTop2026');
    const enviado = await flush({ valido: true, descuento: 166.75, subtotal: 1150, total: 1140.57, cupones: [
      { codigo: 'BUEN-FIN2026', valido: true, descuento: 57.5 }, { codigo: 'CLIENTETOP2026', valido: true, descuento: 109.25 }] });
    expect(enviado.codigos).toEqual(['BUEN-FIN2026', 'CLIENTETOP2026']);
    expect(await dos).toBe(true);
    expect(cart.couponCodes()).toEqual(['BUEN-FIN2026', 'CLIENTETOP2026']);
    expect(cart.couponItems().map(c => c.descuento)).toEqual([57.5, 109.25]);
    expect(cart.totalWithCoupon()).toBe(1140.57);
    expect(cart.couponNotice()).toBeNull();
    expect(JSON.parse(sessionStorage.getItem('bsv.cupones') ?? '[]').length).toBeLessThanOrEqual(2);
  });

  it('el que no entra se quita de la lista y se dice por qué; el que ya estaba se conserva', async () => {
    cart.couponCodes.set(['BUEN-FIN2026']);
    const p = cart.applyCoupon('FUERTE');
    await flush({ valido: false, descuento: 57.5, subtotal: 1150, total: 1267.3, cupones: [
      { codigo: 'BUEN-FIN2026', valido: true, descuento: 57.5 }, { codigo: 'FUERTE', valido: false, motivo: 'Este cupón no se puede combinar con otros.', descuento: 0 }] });
    await flush({ valido: true, descuento: 57.5, subtotal: 1150, total: 1267.3, cupones: [{ codigo: 'BUEN-FIN2026', valido: true, descuento: 57.5 }] });
    expect(await p).toBe(false);
    expect(cart.couponCodes()).toEqual(['BUEN-FIN2026']);
    expect(cart.couponNotice()).toContain('no se puede combinar');
    expect(cart.coupon()?.valido).toBe(true);
  });

  it('un código que no existe: «no es válido», sin más detalle, y no queda aplicado', async () => {
    const p = cart.applyCoupon('nada');
    await flush({ valido: false, motivo: 'no válido', descuento: 0, subtotal: 1150, total: 1334, cupones: [{ codigo: 'NADA', valido: false, motivo: 'no válido', descuento: 0 }] });
    expect(await p).toBe(false);
    expect(cart.couponCodes()).toEqual([]); expect(cart.coupon()).toBeNull();
    expect(cart.couponNotice()).toBe('El cupón NADA no es válido.');
  });

  it('repetir un cupón no lo manda otra vez; quitarlo revalida los demás; el tope se avisa', async () => {
    cart.couponCodes.set(['A10', 'B10']);
    expect(await cart.applyCoupon('a10')).toBe(false);
    expect(cart.couponNotice()).toContain('ya está aplicado');
    const q = cart.removeCoupon('A10');
    expect((await flush({ valido: true, descuento: 115, subtotal: 1150, total: 1200.6, cupones: [{ codigo: 'B10', valido: true, descuento: 115 }] })).codigos).toEqual(['B10']);
    await q;
    expect(cart.couponCodes()).toEqual(['B10']);
    const r = cart.applyCoupon('C10');
    await flush({ valido: true, topeAplicado: true, descuento: 172.5, subtotal: 1150, total: 1133.9, cupones: [
      { codigo: 'B10', valido: true, descuento: 115 }, { codigo: 'C10', valido: true, descuento: 57.5 }] });
    expect(await r).toBe(true);
    expect(cart.couponNotice()).toContain('descuento máximo');
  });

  it('un cupón guardado con la clave anterior (cuando era uno solo) se conserva', () => {
    sessionStorage.setItem('bsv.cupon', 'BUEN-FIN2026');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    expect(TestBed.inject(CartService).couponCodes()).toEqual(['BUEN-FIN2026']);
  });
});
