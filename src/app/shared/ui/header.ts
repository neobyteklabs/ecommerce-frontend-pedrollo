import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { BRAND } from '../../core/brand';
import { CartService } from '../../core/cart';
import { ToastService } from '../../core/toast';
import { Icon } from './icon';
import { FAMILIES, NAV_FAMILIES } from '../../core/catalog';

@Component({
  selector: 'bsv-header', imports: [RouterLink, RouterLinkActive, Icon],
  template: `
  <header class="site-header" data-component="Header">
    <div class="topbar">Distribuidor autorizado {{ brand.name }} · Envío a todo México · Factura disponible · <a href="tel:+525572589681">55 7258 9681</a></div>
    <div class="container">
      <div class="header-main">
        <a class="brand" routerLink="/" [attr.aria-label]="brand.name + ', inicio'" data-component="Brand/Logo">
          @if (brand.logo) {
            <span class="logo-slot" data-slot="logo"><picture>@if (brand.logoCompact) { <source media="(max-width: 767px)" [srcset]="brand.logoCompact" /> }<img [src]="brand.logo" [alt]="brand.name + ' · Bombas y Sistemas Vega, distribuidor autorizado'" width="475" height="86" /></picture></span>
          } @else {
            <span class="logo-slot" data-slot="logo"></span>
            <span><span class="wordmark" style="--brand-name:'{{ brand.name }}'"></span><span class="by">por Bombas y Sistemas Vega</span></span>
          }
        </a>
        <form class="header-search" role="search" data-component="SearchBar" (submit)="go($event, q.value)">
          <label class="sr-only" for="q">Buscar modelo o producto</label>
          <div class="input-group"><bsv-icon name="search" style="--icon:20px" /><input #q id="q" name="q" type="search" placeholder="Buscar por modelo, HP o uso: PKm 60, 1 HP, pozo…" autocomplete="off" /></div>
        </form>
        <div class="header-actions">
          <a class="icon-btn hide-mobile" routerLink="/cuenta"><bsv-icon name="user" /><span>Cuenta</span></a>
          <a class="icon-btn" routerLink="/carrito" aria-label="Carrito"><bsv-icon name="cart" /><span class="hide-mobile">Carrito</span><span class="count">{{ cart.count() || '' }}</span></a>
          <button class="icon-btn hide-desktop" type="button" aria-label="Menú" (click)="toast.show('Menú lateral: categorías, cuenta, ayuda')"><bsv-icon name="menu" /></button>
        </div>
      </div>
      <form class="mobile-search" role="search" (submit)="go($event, qm.value)"><label class="sr-only" for="qm">Buscar</label><div class="input-group"><bsv-icon name="search" style="--icon:20px" /><input #qm id="qm" name="q" type="search" placeholder="Buscar modelo, HP o uso…" /></div></form>
      <nav class="header-nav" aria-label="Categorías" data-component="MainNav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page">Inicio</a>
        @for (c of cats; track c.slug) { <a [routerLink]="['/categoria', c.slug]" routerLinkActive ariaCurrentWhenActive="page">{{ c.name }}</a> }<a routerLink="/categoria/accesorios">Más…</a>
      </nav>
    </div>
  </header>`,
})
export class Header {
  brand = inject(BRAND); cart = inject(CartService); toast = inject(ToastService); private router = inject(Router);
  cats = NAV_FAMILIES.map(s => FAMILIES.find(f => f.slug === s)!);
  go(e: Event, q: string) { e.preventDefault(); this.router.navigate(['/buscar'], { queryParams: { q } }); }
}
