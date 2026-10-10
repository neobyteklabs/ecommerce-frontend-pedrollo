import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from '../../core/session';
import { Icon } from '../../shared/ui';
@Component({
  selector: 'bsv-account-nav', imports: [RouterLink, RouterLinkActive, Icon],
  template: `<nav class="account-nav" aria-label="Mi cuenta" data-component="AccountNav">
    <a routerLink="/cuenta/pedidos" routerLinkActive ariaCurrentWhenActive="page"><bsv-icon name="package" style="--icon:20px" />Mis pedidos</a>
    <a routerLink="/cuenta" routerLinkActive ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }"><bsv-icon name="mapPin" style="--icon:20px" />Direcciones</a>
    <a routerLink="/cuenta" fragment="fiscal"><bsv-icon name="building" style="--icon:20px" />Datos fiscales</a>
    <a routerLink="/cuenta/factura" routerLinkActive ariaCurrentWhenActive="page"><bsv-icon name="receipt" style="--icon:20px" />Facturas</a>
    <a routerLink="/cuenta/devolucion" routerLinkActive ariaCurrentWhenActive="page"><bsv-icon name="rotate" style="--icon:20px" />Devoluciones</a>
    <a routerLink="/login" (click)="s.logout()"><bsv-icon name="logout" style="--icon:20px" />Cerrar sesión</a>
  </nav>`,
})
export class AccountNav { s = inject(SessionService); }
