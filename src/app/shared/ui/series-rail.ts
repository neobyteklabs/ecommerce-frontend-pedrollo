import { Component, ElementRef, computed, input, signal, viewChild, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { imageFor } from '../../core/images';

export interface SeriesRef { slug: string; name: string; count?: number | null; }

/**
 * Carrusel de series (11-nov): la página larga de cada serie solo se alcanzaba desde la ficha de un producto. Aquí va al frente en la
 * familia, la búsqueda y la portada: una imagen grande por serie (su hero si ya está instalado; si no, la foto oficial), el nombre encima
 * y nada más. Toda la tarjeta abre la serie. Se desliza con el dedo o con las flechas; sin JavaScript sigue siendo una fila deslizable.
 */
@Component({
  selector: 'bsv-series-rail', imports: [RouterLink],
  host: { class: 'series-rail-host', 'data-component': 'SeriesRail' },
  template: `
  @if (cards().length) {
  <div class="series-rail-head"><h2>{{ title() }}</h2>
    <div class="series-rail-nav" [hidden]="!puede().antes && !puede().despues">
      <button type="button" aria-label="Series anteriores" [disabled]="!puede().antes" (click)="mover(-1)">‹</button>
      <button type="button" aria-label="Más series" [disabled]="!puede().despues" (click)="mover(1)">›</button>
    </div>
  </div>
  <div class="series-rail" #pista (scroll)="medir()" tabindex="0" role="group" [attr.aria-label]="title()">
    @for (c of cards(); track c.slug) {
      <a class="series-card" [routerLink]="['/serie', c.slug]" [attr.data-serie]="c.slug" [class.has-hero]="c.hero" [attr.aria-label]="'Ver la serie ' + c.name">
        @if (c.img) { <img [src]="c.img" alt="" loading="lazy" decoding="async" /> }
        <span class="series-card-copy"><strong>{{ c.name }}</strong>@if (c.count) { <span>{{ c.count }} {{ c.count === 1 ? 'modelo' : 'modelos' }}</span> }</span>
      </a>
    }
  </div>
  }`,
})
export class SeriesRail {
  series = input.required<SeriesRef[]>(); title = input('Series');
  private pista = viewChild<ElementRef<HTMLElement>>('pista');
  puede = signal({ antes: false, despues: false });
  cards = computed(() => this.series().filter(s => s.slug).map(s => {
    const hero = imageFor(`serie-${s.slug}-hero`);
    return { slug: s.slug, name: s.name, count: s.count ?? null, hero: !!hero, img: hero ?? imageFor(`catalog-${s.slug}`) };
  }));
  constructor() { afterNextRender(() => { this.medir(); setTimeout(() => this.medir(), 300); }); }
  medir() { const el = this.pista()?.nativeElement; if (!el) return; this.puede.set({ antes: el.scrollLeft > 4, despues: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 }); }
  /** Avanza casi un «pantallazo» de tarjetas; el snap de CSS termina de alinear. */
  mover(dir: 1 | -1) { const el = this.pista()?.nativeElement; if (!el) return; el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' }); }
}
