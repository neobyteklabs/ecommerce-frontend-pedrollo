import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from '../../core/session';
import { Icon } from '../../shared/ui';
@Component({
  selector: 'bsv-account-nav', imports: [RouterLink, RouterLinkActive, Icon],
  template: `<nav class="account-nav" aria-label="Mi cuenta" data-component="AccountNav">
    <a routerLink="/cuenta" routerLinkActive ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }"><bsv-icon name="user" style="--icon:20px" />Mi cuenta</a>
    <a routerLink="/cuenta/pedidos" routerLinkActive ariaCurrentWhenActive="page"><bsv-icon name="package" style="--icon:20px" />Mis pedidos</a>
    <a routerLink="/terminos" fragment="devoluciones"><bsv-icon name="rotate" style="--icon:20px" />Devoluciones</a>
    <button type="button" (click)="salir()" data-testid="salir"><bsv-icon name="logout" style="--icon:20px" />Cerrar sesión</button>
  </nav>`,
  styles: [`button{all:unset;cursor:pointer;display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:var(--radius-md);color:inherit;font:inherit}button:hover{background:var(--color-surface-sunken)}button:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px}`],
})
export class AccountNav { private s = inject(SessionService); private r = inject(Router); async salir() { await this.s.logout(); await this.r.navigateByUrl('/'); } }
