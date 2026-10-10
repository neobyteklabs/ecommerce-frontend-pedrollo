import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/toast';
import { Icon } from './icon';
@Component({
  selector: 'bsv-toasts', imports: [Icon, RouterLink],
  host: { class: 'toast-region', role: 'status', 'aria-live': 'polite' },
  template: `@for (t of toast.items(); track t.id) { <div class="toast" [class]="'toast toast-' + t.kind"><bsv-icon [name]="t.kind === 'success' ? 'check' : 'alert'" style="--icon:20px" /><span>{{ t.msg }}</span>@if (t.link) { <a [routerLink]="t.link.href">{{ t.link.label }}</a> }</div> }`,
})
export class Toasts { toast = inject(ToastService); }
