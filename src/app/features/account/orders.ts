import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccountOrder, SessionService } from '../../core/session';
import { mxn } from '../../core/products';
import { Icon } from '../../shared/ui';
import { AccountNav } from './account-nav';

/** Cómo se le dice al comprador el estado de pago del pedido. El avance de la entrega se ve en el seguimiento. */
export const PAGO_LABEL: Record<string, { label: string; badge: string }> = {
  pagado: { label: 'Pagado', badge: 'pagado' }, pendiente_pago: { label: 'Pendiente de pago', badge: 'recibido' }, cancelado: { label: 'Cancelado', badge: 'cancelado' },
};
export const etiquetaDe = (o: Pick<AccountOrder, 'estado'>) => PAGO_LABEL[o.estado] ?? { label: o.estado, badge: 'recibido' };

/** Mis pedidos (bala 9): los hechos con el correo de la cuenta, también los de cuando se compró como invitado. Cada uno abre su seguimiento. */
@Component({
  selector: 'bsv-orders', imports: [RouterLink, Icon, AccountNav],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'MisPedidos' },
  template: `<div class="account-layout"><bsv-account-nav /><div>
    <h1 style="font-size:var(--text-2xl)">Mis pedidos</h1>
    @if (error()) { <p class="muted" data-testid="pedidos-error">{{ error() }}</p> }
    @else if (pedidos() === null) { <p class="muted">Cargando tus pedidos…</p> }
    @else {
      <div class="stack-sm" data-component="OrderList">
        @for (o of pedidos(); track o.folio) {
          <a class="order-row" [routerLink]="['/seguimiento', o.folio]" [queryParams]="{ c: correo() }" [attr.data-pedido]="o.numero"><div><span class="mono" style="font-weight:600">{{ o.numero }}</span><div class="small muted">{{ fecha(o.creado) }} · {{ o.piezas }} {{ o.piezas === 1 ? 'pieza' : 'piezas' }}</div></div><span class="badge" [class]="'badge badge-' + etiqueta(o).badge">{{ etiqueta(o).label }}</span><span class="num" style="font-weight:600">{{ mxn(o.total) }}</span><bsv-icon name="chevronRight" class="muted" /></a>
        } @empty { <div class="card" data-testid="pedidos-vacio"><p style="margin:0">Todavía no hay pedidos con <strong>{{ correo() }}</strong>.</p><p class="muted small" style="margin:8px 0 0">Si compraste con otro correo, puedes ver ese pedido en <a routerLink="/seguimiento">Seguimiento</a> con su número.</p></div> }
      </div>
    }</div></div>`,
})
export class Orders implements OnInit {
  private s = inject(SessionService); private r = inject(Router);
  pedidos = signal<AccountOrder[] | null>(null); error = signal<string | null>(null);
  mxn = mxn; etiqueta = etiquetaDe; correo = () => this.s.user()?.correo ?? '';
  fecha = (iso: string) => { const d = new Date(iso); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); };
  async ngOnInit() {
    if (typeof window === 'undefined') { return; }
    try { this.pedidos.set(await this.s.orders()); }
    catch (e) { if ((e as Error).message === 'sesion') { void this.r.navigate(['/login'], { queryParams: { next: '/cuenta/pedidos' } }); } else { this.error.set((e as Error).message); } }
  }
}
