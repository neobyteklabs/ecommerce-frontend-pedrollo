import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../core/cart';
import { Icon } from './icon';
@Component({
  selector: 'bsv-bottombar', imports: [RouterLink, RouterLinkActive, Icon],
  template: `<nav class="bottombar" aria-label="Navegación principal" data-component="BottomBar">
    <a routerLink="/" routerLinkActive ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }"><bsv-icon name="home" /><span>Inicio</span></a>
    <a routerLink="/buscar" routerLinkActive ariaCurrentWhenActive="page"><bsv-icon name="search" /><span>Buscar</span></a>
    <a routerLink="/carrito" routerLinkActive ariaCurrentWhenActive="page"><bsv-icon name="cart" /><span>Carrito</span><span class="count">{{ cart.count() || '' }}</span></a>
    <a routerLink="/cuenta" routerLinkActive ariaCurrentWhenActive="page"><bsv-icon name="user" /><span>Cuenta</span></a>
  </nav>`,
})
export class BottomBar { cart = inject(CartService); }
