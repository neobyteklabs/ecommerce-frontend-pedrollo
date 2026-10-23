import { Component, inject, input, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { StorefrontApi } from '../../core/api/storefront-api';
import { cardFromSummary } from '../../core/api/storefront-view';
import { Icon, ProductCard, ProductSkeleton, Empty } from '../../shared/ui';

/** Búsqueda desde la API de tienda (bala F1): palabras en AND, orden por relevancia. */
@Component({
  selector: 'bsv-search', imports: [RouterLink, Icon, ProductCard, ProductSkeleton, Empty],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Busqueda' },
  template: `
  @if (!q()) {
    <h1 style="font-size:var(--text-2xl)">Buscar</h1>
    <form role="search" class="hero-search" (submit)="go($event, sq.value)"><label class="sr-only" for="sq">Buscar</label><div class="input-group"><bsv-icon name="search" style="--icon:20px" /><input #sq id="sq" type="search" placeholder="Modelo, HP o uso…" autofocus /><button class="btn btn-primary btn-sm">Buscar</button></div></form>
    <h3 style="margin-top:32px">Búsquedas frecuentes</h3><div class="chip-list">@for (s of frequent; track s) { <a class="chip" routerLink="/buscar" [queryParams]="{ q: s }">{{ s }}</a> }</div>
  } @else if (hits.isLoading()) {
    <p class="muted small" style="margin:0">Buscando</p><h1 style="font-size:var(--text-2xl)">“{{ q() }}”</h1>
    <div class="product-grid"><bsv-product-skeleton /><bsv-product-skeleton /><bsv-product-skeleton /><bsv-product-skeleton /></div>
  } @else if (hits.error()) {
    <h1 style="font-size:var(--text-2xl)">“{{ q() }}”</h1>
    <bsv-empty icon="alert" title="No pudimos buscar" data-component="EmptyState/SinConexion">La tienda no respondió. Intenta de nuevo o pide una cotización.<ng-container actions><a class="btn btn-secondary" href="https://wa.me/525572589681"><bsv-icon name="phone" style="--icon:20px" /> Pedir cotización</a></ng-container></bsv-empty>
  } @else if (items().length) {
    <p class="muted small" style="margin:0">Resultados para</p><h1 style="font-size:var(--text-2xl)">“{{ q() }}” <span class="muted" style="font-weight:500;font-size:var(--text-lg)">· {{ total() }} productos</span></h1>
    <div class="product-grid">@for (p of items(); track p.id) { <bsv-product-card [p]="p" /> }</div>
  } @else {
    <h1 style="font-size:var(--text-2xl)">Sin resultados para “{{ q() }}”</h1>
    <bsv-empty icon="search" title="No encontramos ese modelo" data-component="EmptyState/Busqueda">Revisa la ortografía o busca por potencia o uso. También podemos cotizarlo si es un equipo especial.
      <ng-container actions><a class="btn btn-primary" routerLink="/categoria/centrifugas">Ver todo el catálogo</a><a class="btn btn-secondary" href="https://wa.me/525572589681"><bsv-icon name="phone" style="--icon:20px" /> Pedir cotización</a></ng-container></bsv-empty>
    @if (suggested().length) { <h3>Quizá buscabas</h3><div class="product-grid">@for (p of suggested(); track p.id) { <bsv-product-card [p]="p" /> }</div> }
  }`,
})
export class Search {
  q = input('');
  private api = inject(StorefrontApi); private router = inject(Router);
  hits = this.api.products(() => this.q().trim() ? { q: this.q().trim(), size: 48 } : undefined);
  items = computed(() => this.hits.hasValue() ? this.hits.value().content.map(cardFromSummary) : []);
  total = computed(() => this.hits.hasValue() ? this.hits.value().totalElements : 0);
  frequent = ['2CP', 'PK 60', 'CP 160', '4SR', 'TOP', 'JSW'];
  private suggestions = this.api.products(() => ({ familia: 'multietapas', orden: 'serie', size: 4 }));
  suggested = computed(() => this.suggestions.hasValue() ? this.suggestions.value().content.map(cardFromSummary) : []);
  go(e: Event, q: string) { e.preventDefault(); this.router.navigate(['/buscar'], { queryParams: { q } }); }
}
