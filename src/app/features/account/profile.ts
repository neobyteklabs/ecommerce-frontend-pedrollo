import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../core/session';
import { Icon } from '../../shared/ui';
import { AccountNav } from './account-nav';

/** Mi cuenta (bala 9): quién soy y a dónde ir. Direcciones y datos fiscales guardados llegan en el siguiente corte; aquí no se muestra nada que todavía no funcione. */
@Component({
  selector: 'bsv-profile', imports: [RouterLink, Icon, AccountNav],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Cuenta' },
  template: `<div class="account-layout"><bsv-account-nav /><div class="stack">
    @if (s.user(); as u) {
      <div><h1 style="font-size:var(--text-2xl);margin-bottom:4px" data-testid="saludo">Hola{{ nombre() ? ', ' + nombre() : '' }}</h1><span class="muted small">{{ u.correo }} · entraste con Google@if (desde()) { · cliente desde {{ desde() }} }</span></div>
      <section class="card" data-component="AccountHome">
        <div class="grid md-grid-2">
          <a class="trust-item" routerLink="/cuenta/pedidos" style="text-decoration:none;color:inherit"><bsv-icon name="package" style="--icon:28px" /><div><strong>Mis pedidos</strong><span>Lo que has comprado con este correo, con su estado y su seguimiento.</span></div></a>
          <a class="trust-item" routerLink="/seguimiento" style="text-decoration:none;color:inherit"><bsv-icon name="receipt" style="--icon:28px" /><div><strong>Factura y cotizaciones</strong><span>Con el número de tu pedido o cotización pides tu factura o revisas una cotización.</span></div></a>
        </div>
      </section>
      <p class="muted small">Tus pedidos se ligan a tu cuenta por tu correo: si compraste antes como invitado con <strong>{{ u.correo }}</strong>, ya aparecen en «Mis pedidos».</p>
    } @else { <p class="muted">Cargando tu cuenta…</p> }
  </div></div>`,
})
export class Profile {
  s = inject(SessionService);
  nombre = computed(() => (this.s.user()?.nombre ?? '').trim().split(/\s+/)[0] ?? '');
  desde = computed(() => { const d = new Date(this.s.user()?.desde ?? ''); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }); });
}
