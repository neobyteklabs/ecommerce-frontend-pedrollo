import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SERIES } from '../../core/catalog';
import { imageFor } from '../../core/images';

export interface SeriesRef { slug: string; name: string; count?: number | null; }

/**
 * Tarjetas de serie (11-nov): la página larga de cada serie solo se alcanzaba desde la ficha de un producto. Este riel la pone al frente
 * en la familia, la búsqueda y la portada. La imagen es el hero de la serie si ya está instalado; si no, la foto oficial de la serie.
 */
@Component({
  selector: 'bsv-series-rail', imports: [RouterLink],
  host: { class: 'series-rail-host', 'data-component': 'SeriesRail' },
  template: `
  @if (cards().length) {
  <div class="series-rail-head"><h2>{{ title() }}</h2>@if (lead()) { <p class="muted">{{ lead() }}</p> }</div>
  <div class="series-rail" [class.is-wrap]="wrap()">
    @for (c of cards(); track c.slug) {
      <a class="series-card" [routerLink]="['/serie', c.slug]" [attr.data-serie]="c.slug" [class.has-hero]="c.hero">
        <span class="series-card-img">@if (c.img) { <img [src]="c.img" [alt]="'Serie ' + c.name" loading="lazy" decoding="async" /> }</span>
        <span class="series-card-copy"><strong>Serie {{ c.name }}</strong><span class="tipo">{{ c.tipo }}</span><span class="meta">@if (c.count) { {{ c.count }} {{ c.count === 1 ? 'modelo' : 'modelos' }} · } Ver la serie ›</span></span>
      </a>
    }
  </div>
  }`,
})
export class SeriesRail {
  series = input.required<SeriesRef[]>(); title = input('Series'); lead = input<string | null>(null);
  /** `true`: cuadrícula que baja de renglón (familia). `false`: una fila que se desliza (búsqueda, portada). */
  wrap = input(true);
  cards = computed(() => this.series().filter(s => s.slug).map(s => {
    const hero = imageFor(`serie-${s.slug}-hero`); const c = SERIES[s.slug];
    return { slug: s.slug, name: s.name, count: s.count ?? null, hero: !!hero, img: hero ?? imageFor(`catalog-${s.slug}`), tipo: c ? c.kicker.split(' · ').slice(1).join(' · ') : '' };
  }));
}
