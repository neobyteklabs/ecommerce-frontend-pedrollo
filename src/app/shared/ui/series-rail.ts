import { Component, DestroyRef, ElementRef, computed, inject, input, signal, viewChild, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SERIES } from '../../core/catalog';
import { imageFor } from '../../core/images';

export interface SeriesRef { slug: string; name: string; count?: number | null; }

/**
 * Carrusel de series (11-nov): la página larga de cada serie solo se alcanzaba desde la ficha de un producto. Aquí va al frente.
 *  - Por omisión es protagonista: una serie a la vez a todo lo ancho, con su hero, que cambia sola cada `INTERVALO` ms. Se detiene al pasar
 *    el cursor, al enfocarla con teclado o si el usuario pide menos movimiento; flechas, puntos y deslizamiento con el dedo.
 *  - `[bleed]="true"` (familia): encabeza la página de orilla a orilla y lleva el nombre de la familia en el texto.
 *  - `[compact]="true"` (búsqueda): varias tarjetas por pantalla, sin avance automático.
 * Toda la tarjeta abre la serie. Sin JavaScript sigue siendo una fila deslizable.
 */
const INTERVALO = 4500;

@Component({
  selector: 'bsv-series-rail', imports: [RouterLink],
  host: { class: 'series-rail-host', 'data-component': 'SeriesRail', '[class.is-compact]': 'compact()', '[class.is-bleed]': 'bleed()', '(pointerenter)': 'pausa.set(true)', '(pointerleave)': 'pausa.set(false)', '(focusin)': 'pausa.set(true)', '(focusout)': 'pausa.set(false)' },
  template: `
  @if (cards().length) {
  <div class="series-rail-head"><h2>{{ titulo() }}</h2>
    <div class="series-rail-nav" [hidden]="cards().length < 2">
      <button type="button" aria-label="Serie anterior" (click)="mover(-1)">‹</button>
      <button type="button" aria-label="Serie siguiente" (click)="mover(1)">›</button>
    </div>
  </div>
  <div class="series-rail" #pista (scroll)="medir()" tabindex="0" role="group" aria-roledescription="carrusel" [attr.aria-label]="titulo()">
    @for (c of cards(); track c.slug; let i = $index) {
      <a class="series-card" [routerLink]="['/serie', c.slug]" [attr.data-serie]="c.slug" [class.has-hero]="c.hero" [attr.aria-label]="'Ver la serie ' + c.name">
        @if (c.img) { <img [src]="c.img" alt="" [attr.loading]="i === 0 && !compact() ? 'eager' : 'lazy'" decoding="async" /> }
        <span class="series-card-copy"><span class="pre">@if (kicker(); as k) { {{ k }} · }Serie</span><strong>{{ c.name }}</strong>@if (c.tipo) { <span class="tipo">{{ c.tipo }}</span> }<span class="meta">@if (c.count) { {{ c.count }} {{ c.count === 1 ? 'modelo' : 'modelos' }} · } Ver la serie ›</span></span>
      </a>
    }
  </div>
  @if (!compact() && cards().length > 1) {
  <div class="series-rail-dots">@for (c of cards(); track c.slug; let i = $index) { <button type="button" [class.is-on]="i === actual()" [attr.aria-label]="'Ir a la serie ' + c.name" [attr.aria-current]="i === actual() ? 'true' : null" (click)="ir(i)"></button> }</div>
  }
  }`,
})
export class SeriesRail {
  series = input.required<SeriesRef[]>(); /** `titulo` y no `title`: como atributo estático, `title` se queda en el elemento y el navegador lo muestra como tooltip al pasar el cursor. */
  titulo = input('Series'); compact = input(false);
  /** Encabezado de página (familia): a todo el ancho de la pantalla, sin título aparte, con flechas y puntos sobre la imagen. */
  bleed = input(false);
  /** Texto pequeño sobre el nombre de la serie; en la familia es el nombre de la familia («Multietapas · Serie»). */
  kicker = input<string | null>(null);
  private pista = viewChild<ElementRef<HTMLElement>>('pista');
  actual = signal(0); pausa = signal(false);
  cards = computed(() => this.series().filter(s => s.slug).map(s => {
    const hero = imageFor(`serie-${s.slug}-hero`); const c = SERIES[s.slug];
    return { slug: s.slug, name: s.name, count: s.count ?? null, hero: !!hero, img: hero ?? imageFor(`catalog-${s.slug}`), tipo: c ? c.kicker.split(' · ').slice(1).join(' · ') : '' };
  }));
  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      if (this.compact() || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const t = setInterval(() => { if (!this.pausa() && !document.hidden && this.cards().length > 1) this.ir((this.actual() + 1) % this.cards().length); }, INTERVALO);
      destroy.onDestroy(() => clearInterval(t));
    });
  }
  private paso() { const el = this.pista()?.nativeElement; const primera = el?.firstElementChild as HTMLElement | null; return el && primera ? primera.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0') : 0; }
  medir() { const el = this.pista()?.nativeElement; const p = this.paso(); if (el && p) this.actual.set(Math.min(this.cards().length - 1, Math.round(el.scrollLeft / p))); }
  /** Al vecino se desliza; a una lejana (o la vuelta al inicio) se salta, para no rebobinar todo el carrusel a la vista. */
  ir(i: number) { const el = this.pista()?.nativeElement; if (!el) return; const cerca = Math.abs(i - this.actual()) <= 1; this.actual.set(i); el.scrollTo({ left: i * this.paso(), behavior: cerca ? 'smooth' : 'auto' }); }
  /** Protagonista: de una en una y da la vuelta. Compacto: casi un pantallazo de tarjetas. */
  mover(dir: 1 | -1) {
    const el = this.pista()?.nativeElement; if (!el) return;
    if (this.compact()) { el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' }); return; }
    const n = this.cards().length; this.ir((this.actual() + dir + n) % n);
  }
}
