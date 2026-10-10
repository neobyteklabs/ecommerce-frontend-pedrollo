import { Component, inject, input, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ProductService } from '../../core/products';
import { Icon, ProductCard, Empty } from '../../shared/ui';

@Component({
  selector: 'bsv-search', imports: [RouterLink, Icon, ProductCard, Empty],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Busqueda' },
  template: `
  @if (!q()) {
    <h1 style="font-size:var(--text-2xl)">Buscar</h1>
    <form role="search" class="hero-search" (submit)="go($event, sq.value)"><label class="sr-only" for="sq">Buscar</label><div class="input-group"><bsv-icon name="search" style="--icon:20px" /><input #sq id="sq" type="search" placeholder="Modelo, HP o uso…" autofocus /><button class="btn btn-primary btn-sm">Buscar</button></div></form>
    <h3 style="margin-top:32px">Búsquedas frecuentes</h3><div class="chip-list">@for (s of frequent; track s) { <a class="chip" routerLink="/buscar" [queryParams]="{ q: s }">{{ s }}</a> }</div>
  } @else if (hits().length) {
    <p class="muted small" style="margin:0">Resultados para</p><h1 style="font-size:var(--text-2xl)">“{{ q() }}” <span class="muted" style="font-weight:500;font-size:var(--text-lg)">· {{ hits().length }} productos</span></h1>
    <div class="product-grid">@for (p of hits(); track p.id) { <bsv-product-card [p]="p" /> }</div>
  } @else {
    <h1 style="font-size:var(--text-2xl)">Sin resultados para “{{ q() }}”</h1>
    <bsv-empty icon="search" title="No encontramos ese modelo" data-component="EmptyState/Busqueda">Revisa la ortografía o busca por potencia o uso. También podemos cotizarlo si es un equipo especial.
      <ng-container actions><a class="btn btn-primary" routerLink="/categoria/superficie">Ver todo el catálogo</a><a class="btn btn-secondary" href="https://wa.me/525572589681"><bsv-icon name="phone" style="--icon:20px" /> Pedir cotización</a></ng-container></bsv-empty>
    <h3>Quizá buscabas</h3><div class="product-grid">@for (p of suggestions; track p.id) { <bsv-product-card [p]="p" /> }</div>
  }`,
})
export class Search {
  q = input('');
  private products = inject(ProductService); private router = inject(Router);
  hits = computed(() => this.products.search(this.q()));
  frequent = ['2CP', 'PK 60', 'CP 160', '4SR', 'TOP', 'JSW'];
  suggestions = this.products.featured().slice(0, 4);
  go(e: Event, q: string) { e.preventDefault(); this.router.navigate(['/buscar'], { queryParams: { q } }); }
}
