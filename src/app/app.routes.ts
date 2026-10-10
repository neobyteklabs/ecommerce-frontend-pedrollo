import { Routes } from '@angular/router';
import { authGuard } from './core/session';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/catalog/home').then(m => m.Home), title: 'Tienda Pedrollo · Bombas y Sistemas Vega' },
  { path: 'categoria/:slug', loadComponent: () => import('./features/catalog/category').then(m => m.Category), title: 'Catálogo' },
  { path: 'buscar', loadComponent: () => import('./features/catalog/search').then(m => m.Search), title: 'Buscar' },
  { path: 'producto/:id', loadComponent: () => import('./features/catalog/product').then(m => m.ProductPage), title: 'Producto' },
  { path: 'serie/:serie', loadComponent: () => import('./features/catalog/series').then(m => m.Series), title: 'Serie 4SR · Sumergibles para pozo' },
  { path: 'carrito', loadComponent: () => import('./features/cart/cart').then(m => m.Cart), title: 'Carrito' },
  { path: 'login', loadComponent: () => import('./features/auth/login').then(m => m.Login), title: 'Iniciar sesión' },
  { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./features/checkout/checkout').then(m => m.Checkout), title: 'Pagar' },
  { path: 'cuenta', canActivate: [authGuard], children: [
    { path: '', loadComponent: () => import('./features/account/profile').then(m => m.Profile), title: 'Mi cuenta' },
    { path: 'pedidos', loadComponent: () => import('./features/account/orders').then(m => m.Orders), title: 'Mis pedidos' },
    { path: 'pedidos/:id', loadComponent: () => import('./features/account/order-detail').then(m => m.OrderDetail), title: 'Detalle del pedido' },
    { path: 'factura', loadComponent: () => import('./features/account/invoice').then(m => m.Invoice), title: 'Solicitar factura' },
    { path: 'devolucion', loadComponent: () => import('./features/account/return').then(m => m.Return), title: 'Devoluciones' },
  ] },
  { path: 'legal', loadComponent: () => import('./features/legal/legal').then(m => m.Legal), title: 'Ayuda y legales' },
  { path: '**', redirectTo: '' },
];
