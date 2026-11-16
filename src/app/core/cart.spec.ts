import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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
