import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/ui';
import { AccountNav } from './account-nav';
import { Reveal } from '../../shared/directives/motion';

export interface OrderSummaryRow { id: string; date: string; items: string; status: 'recibido' | 'pagado' | 'preparacion' | 'enviado' | 'entregado' | 'cancelado'; total: string; }
export const STATUS_LABEL: Record<OrderSummaryRow['status'], string> = { recibido: 'Recibido', pagado: 'Pagado', preparacion: 'En preparación', enviado: 'Enviado', entregado: 'Entregado', cancelado: 'Cancelado' };
export const ORDERS: OrderSummaryRow[] = [
  { id: 'BSV-24-01837', date: '8 oct 2026', items: 'PKm 60 ×2, 4SR 2/9 ×1', status: 'enviado', total: '$13,580.00' },
  { id: 'BSV-24-01790', date: '1 oct 2026', items: 'CPm 158 ×1', status: 'preparacion', total: '$4,280.00' },
  { id: 'BSV-24-01644', date: '19 sep 2026', items: 'TOP 2 ×3', status: 'entregado', total: '$9,450.00' },
  { id: 'BSV-24-01512', date: '4 sep 2026', items: 'PKm 100 ×1 · Devolución reembolsada', status: 'entregado', total: '$2,650.00' },
  { id: 'BSV-24-01398', date: '21 ago 2026', items: 'HF 6B ×1', status: 'pagado', total: '$18,500.00' },
  { id: 'BSV-24-01201', date: '2 ago 2026', items: 'EASYPRESS 2M ×2', status: 'cancelado', total: '$5,780.00' },
];

@Component({
  selector: 'bsv-orders', imports: [RouterLink, Icon, AccountNav, Reveal],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'MisPedidos' },
  template: `<div class="account-layout"><bsv-account-nav /><div>
    <h1 style="font-size:var(--text-2xl)">Mis pedidos</h1>
    <div class="chip-list" style="margin-bottom:16px">@for (f of filters; track f.k) { <button class="chip" type="button" [attr.aria-pressed]="filter() === f.k" (click)="filter.set(f.k)">{{ f.label }}</button> }</div>
    <div class="stack-sm" data-component="OrderList">
      @for (o of rows(); track o.id; let i = $index) {
        <a class="order-row" [routerLink]="['/cuenta/pedidos', o.id]" bsvReveal [revealIndex]="i"><div><span class="mono" style="font-weight:600">{{ o.id }}</span><div class="small muted">{{ o.date }} · {{ o.items }}</div></div><span class="badge" [class]="'badge badge-' + o.status">{{ label[o.status] }}</span><span class="num" style="font-weight:600">{{ o.total }}</span><bsv-icon name="chevronRight" class="muted" /></a>
      }
    </div></div></div>`,
})
export class Orders {
  label = STATUS_LABEL; filter = signal('all');
  filters = [{ k: 'all', label: 'Todos (6)' }, { k: 'open', label: 'En curso (2)' }, { k: 'entregado', label: 'Entregados' }];
  rows = () => ORDERS.filter(o => this.filter() === 'all' || (this.filter() === 'open' ? ['preparacion', 'enviado', 'pagado', 'recibido'].includes(o.status) && o.status !== 'pagado' : o.status === this.filter()));
}
