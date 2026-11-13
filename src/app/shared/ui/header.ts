import { Component, DestroyRef, ElementRef, PLATFORM_ID, effect, inject, signal, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationStart } from '@angular/router';
import { BRAND } from '../../core/brand';
import { CartService } from '../../core/cart';
import { SessionService } from '../../core/session';
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
          <button #menuBtn class="icon-btn hide-desktop" type="button" aria-label="Menú" aria-haspopup="dialog" aria-controls="menu-lateral" [attr.aria-expanded]="menu()" (click)="menu.set(true)"><bsv-icon name="menu" /></button>
        </div>
      </div>
      <form class="mobile-search" role="search" (submit)="go($event, qm.value)"><label class="sr-only" for="qm">Buscar</label><div class="input-group"><bsv-icon name="search" style="--icon:20px" /><input #qm id="qm" name="q" type="search" placeholder="Buscar modelo, HP o uso…" /></div></form>
      <nav class="header-nav" aria-label="Categorías" data-component="MainNav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page">Inicio</a>
        @for (c of cats; track c.slug) { <a [routerLink]="['/categoria', c.slug]" routerLinkActive ariaCurrentWhenActive="page">{{ c.name }}</a> }<a routerLink="/catalogo" routerLinkActive ariaCurrentWhenActive="page">Más…</a>
      </nav>
    </div>
  </header>
  <!-- Fuera de <header>: su backdrop-filter lo vuelve bloque contenedor de los position:fixed y el panel quedaría recortado a la cabecera. -->
  <div class="drawer-backdrop" [class.is-open]="menu()" (click)="menu.set(false)"></div>
  <aside class="drawer" id="menu-lateral" role="dialog" aria-modal="true" aria-label="Menú" [class.is-open]="menu()" [attr.inert]="menu() ? null : ''" data-component="SideMenu" (keydown.escape)="menu.set(false)">
    <div class="drawer-head"><strong>Menú</strong><button #closeBtn class="btn btn-ghost btn-icon" type="button" aria-label="Cerrar menú" (click)="menu.set(false)"><bsv-icon name="x" /></button></div>
    <nav class="drawer-body" aria-label="Menú lateral">
      <h3>Categorías</h3>
      @for (c of allCats; track c.slug) { <a [routerLink]="['/categoria', c.slug]" routerLinkActive="active">{{ c.name }}</a> }
      <h3>Tu cuenta</h3>
      @if (session.user(); as u) {
        <a routerLink="/cuenta" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><bsv-icon name="user" style="--icon:20px" /> {{ u.nombre || 'Mi cuenta' }}</a>
        <a routerLink="/cuenta/pedidos" routerLinkActive="active"><bsv-icon name="package" style="--icon:20px" /> Mis pedidos</a>
      } @else {
        <a routerLink="/login" routerLinkActive="active"><bsv-icon name="user" style="--icon:20px" /> Iniciar sesión</a>
      }
      <a routerLink="/carrito" routerLinkActive="active"><bsv-icon name="cart" style="--icon:20px" /> Carrito @if (cart.count()) { <span class="muted">({{ cart.count() }})</span> }</a>
      <h3>Ayuda</h3>
      <a routerLink="/seguimiento" routerLinkActive="active"><bsv-icon name="truck" style="--icon:20px" /> Rastrea tu pedido o cotización</a>
      <a routerLink="/contacto" routerLinkActive="active"><bsv-icon name="mail" style="--icon:20px" /> Contacto</a>
      <a routerLink="/terminos" routerLinkActive="active"><bsv-icon name="file" style="--icon:20px" /> Términos, envíos y devoluciones</a>
      <a routerLink="/privacidad" routerLinkActive="active"><bsv-icon name="shield" style="--icon:20px" /> Aviso de privacidad</a>
      <a href="tel:+525572589681"><bsv-icon name="phone" style="--icon:20px" /> 55 7258 9681</a>
    </nav>
  </aside>`,
})
export class Header {
  brand = inject(BRAND); cart = inject(CartService); session = inject(SessionService); private router = inject(Router);
  cats = NAV_FAMILIES.map(s => FAMILIES.find(f => f.slug === s)!);
  /** El menú lateral lista todas las familias; la barra de escritorio, solo las principales. */
  allCats = FAMILIES;
  menu = signal(false);
  private menuBtn = viewChild<ElementRef<HTMLElement>>('menuBtn');
  private closeBtn = viewChild<ElementRef<HTMLElement>>('closeBtn');

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    // Cualquier navegación (un enlace del menú, el botón «atrás») lo cierra.
    const sub = this.router.events.subscribe(e => { if (e instanceof NavigationStart) this.menu.set(false); });
    inject(DestroyRef).onDestroy(() => { sub.unsubscribe(); document.body.style.overflow = ''; });
    let wasOpen = false;
    effect(() => {
      const open = this.menu();
      document.body.style.overflow = open ? 'hidden' : '';
      // El foco entra al panel al abrir y regresa al botón al cerrar; sin esto el teclado se queda detrás del panel.
      if (open) queueMicrotask(() => this.closeBtn()?.nativeElement.focus());
      else if (wasOpen) this.menuBtn()?.nativeElement.focus();
      wasOpen = open;
    });
  }
  go(e: Event, q: string) { e.preventDefault(); this.router.navigate(['/buscar'], { queryParams: { q } }); }
}
