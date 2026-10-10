import { Component, input } from '@angular/core';
export interface TimelineStep { title: string; meta?: string; state: 'done' | 'current' | 'pending' | 'rejected'; }
/** Línea de tiempo vertical (pedido, devolución, factura). El contenido proyectado va bajo el paso actual. */
@Component({
  selector: 'bsv-timeline',
  host: { 'data-component': 'OrderTimeline' },
  template: `<ol class="timeline">
    @for (s of steps(); track s.title) {
      <li [class]="'is-' + s.state"><span class="t-title">{{ s.title }}</span>@if (s.meta) { <span class="t-meta">{{ s.meta }}</span> }
        @if (s.state === 'current') { <ng-content /> }
        @if (s.state === 'rejected') { <ng-content select="[rejected]" /> }
      </li>
    }
  </ol>`,
})
export class Timeline { steps = input.required<TimelineStep[]>(); }
