import { Injectable, signal } from '@angular/core';
export interface Toast { id: number; msg: string; kind: 'success' | 'danger'; link?: { href: string; label: string }; }
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly items = signal<Toast[]>([]);
  private n = 0;
  show(msg: string, kind: Toast['kind'] = 'success', link?: Toast['link']) {
    const t = { id: ++this.n, msg, kind, link }; this.items.update(x => [...x, t]);
    setTimeout(() => this.items.update(x => x.filter(i => i.id !== t.id)), 4000);
  }
}
