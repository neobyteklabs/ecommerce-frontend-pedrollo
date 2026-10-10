import { Component, inject, input, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService, Product } from '../../core/products';
import { Icon, ProductCard, ProductSkeleton } from '../../shared/ui';
import { Reveal } from '../../shared/directives/motion';

import { familyBySlug, FAMILIES } from '../../core/catalog';
import { familyHero } from '../../core/resources';
import { ImgSlot } from '../../shared/ui';

@Component({
  selector: 'bsv-category', imports: [RouterLink, Icon, ProductCard, ProductSkeleton, Reveal, ImgSlot],
  host: { class: 'container block', 'data-page': 'Categoria' },
  template: `
  <nav aria-label="Migas de pan"><ol class="breadcrumb" data-component="Breadcrumb"><li><a routerLink="/">Inicio</a></li><li><a routerLink="/categoria/centrifugas">Catálogo</a></li><li aria-current="page">{{ cat().name }}</li></ol></nav>
  @if (hero(); as h) {
  <div class="family-hero" data-component="FamilyHero">
    <bsv-img-slot [slot]="'familia-' + slug() + '-hero'" [src]="h.web" [scene]="true" [eager]="true" [alt]="cat().name + ', imagen comercial de familia'" />
    <div class="family-hero-copy"><span class="eyebrow">Familia</span><h1>{{ cat().name }}</h1>@if (h.pending) { <span class="badge badge-warning no-dot">Pendiente de aprobación visual · modo revisión</span> }</div>
  </div>
  <p class="xs muted" style="margin:6px 0 16px">Imagen comercial estilizada de familia (lote {{ h.lote }}, v{{ h.version }}, referencia {{ h.reference_slug }}). No representa un modelo exacto.</p>
  } @else {
  <h1 style="font-size:var(--text-2xl)">{{ cat().name }} <span class="muted" style="font-weight:500;font-size:var(--text-lg)">· {{ items().length }} modelos</span></h1>
  }
  @if (serie(); as sr) { <p class="small"><a [routerLink]="['/serie', slugOf(sr)]">Ver página de la serie {{ sr }} ›</a></p> }
  <p class="muted" style="max-width:70ch">{{ cat().desc }} Especificaciones de la ficha 60 Hz; precio y disponibilidad por confirmar con BSV.</p>
  <div class="chip-list" style="margin-bottom:24px" data-component="SeriesChips">@for (sr of cat().series; track sr.serie) { <button class="chip" type="button" [attr.aria-pressed]="serie() === sr.serie" (click)="serie.set(serie() === sr.serie ? null : sr.serie)">{{ sr.serie }} <span class="muted">({{ sr.n }})</span></button> }</div>
  <div class="catalog">
    <aside class="filters" [class.is-open]="open()" id="filters" data-component="FilterPanel" aria-label="Filtros">
      <div class="between hide-desktop" style="margin-bottom:8px"><strong>Filtros</strong><button class="btn btn-ghost btn-icon" type="button" aria-label="Cerrar filtros" (click)="open.set(false)"><bsv-icon name="x" /></button></div>
      @for (g of groups(); track g.name) {
        <details class="filter-group" [open]="g.open"><summary>{{ g.name }}</summary>
          @for (o of g.options; track o.label) { <label class="check"><input type="checkbox" [checked]="active().has(o.label)" (change)="toggle(o.label)" /> {{ o.label }} @if (o.n) { <span class="muted">({{ o.n }})</span> }</label> }
        </details>
      }
      <div class="hide-desktop" style="padding-top:16px"><button class="btn btn-primary btn-block" type="button" (click)="open.set(false)">Ver {{ items().length }} resultados</button></div>
    </aside>
    <div>
      <div class="catalog-toolbar" data-component="CatalogToolbar">
        <div class="chip-list" data-component="ActiveChips">
          @for (a of active(); track a) { <button class="chip" aria-pressed="true" type="button" (click)="toggle(a)">{{ a }} <bsv-icon name="x" style="--icon:16px" /></button> }
          @if (active().size) { <button class="chip chip-clear" type="button" (click)="clear()">Limpiar filtros</button> }
        </div>
        <div class="row">
          <button class="btn btn-secondary btn-sm hide-desktop" type="button" style="min-height:44px" (click)="open.set(true)"><bsv-icon name="filter" style="--icon:20px" /> Filtros ({{ active().size }})</button>
          <label class="sr-only" for="sort">Ordenar</label>
          <select id="sort" class="select" style="width:auto;min-height:44px" (change)="sort.set($any($event.target).value)"><option value="serie">Por serie</option><option value="hp-asc">Potencia: menor a mayor</option><option value="hp-desc">Potencia: mayor a menor</option></select>
        </div>
      </div>
      <div class="product-grid">
        @for (p of items(); track p.id; let i = $index) { <bsv-product-card [p]="p" bsvReveal="scale" [revealIndex]="i % 4" /> }
        @if (loading()) { <bsv-product-skeleton /><bsv-product-skeleton /> }
      </div>
      <nav aria-label="Paginación"><ul class="pagination" data-component="Pagination"><li><a href="#" aria-label="Anterior"><bsv-icon name="arrowLeft" /></a></li><li><a href="#" aria-current="page">1</a></li><li><a href="#">2</a></li><li><a href="#">3</a></li><li><a href="#" aria-label="Siguiente"><bsv-icon name="arrowRight" /></a></li></ul></nav>
    </div>
  </div>`,
})
export class Category {
  slug = input('superficie');
  private products = inject(ProductService);
  open = signal(false); loading = signal(false); sort = signal('ventas'); active = signal(new Set<string>());
  serie = signal<string | null>(null);
  hero = computed(() => familyHero(this.slug(), this.products.reviewMode()));
  cat = computed(() => familyBySlug(this.slug()) ?? FAMILIES[0]);
  /** Filtros construidos con los valores reales de la ficha 60 Hz de los modelos de la familia. */
  groups = computed(() => {
    const xs = this.products.byFamily(this.slug());
    const count = (f: (p: Product) => boolean) => xs.filter(f).length;
    const hps = [...new Set(xs.map(p => p.hp).filter((h): h is number => h != null))].sort((a, b) => a - b);
    const volts = [...new Set(xs.flatMap(p => p.voltages))].sort();
    return [
      { name: 'Potencia (HP)', open: true, options: hps.map(h => ({ label: `${h} HP`, n: count(p => p.hp === h) })) },
      { name: 'Tensión (60 Hz)', open: true, options: volts.map(v => ({ label: v, n: count(p => p.voltages.includes(v)) })) },
      { name: 'Fase', open: true, options: ['Monofásica', 'Trifásica'].map(f => ({ label: f, n: count(p => p.phase === f) })) },
      { name: 'Ficha técnica', open: false, options: [{ label: 'Validados en ficha 60 Hz', n: count(p => p.validated) }, { label: 'Especificaciones pendientes', n: count(p => !p.validated) }] },
    ].filter(g => g.options.length);
  });
  items = computed(() => {
    const f = this.active(); let xs = this.products.byFamily(this.slug());
    if (this.serie()) xs = xs.filter(p => p.serieName === this.serie());
    const hp = [...f].filter(x => x.endsWith(' HP')).map(x => parseFloat(x)); const v = [...f].filter(x => x.endsWith(' V')); const ph = [...f].filter(x => /fásica/.test(x));
    if (hp.length) xs = xs.filter(p => p.hp != null && hp.includes(p.hp)); if (v.length) xs = xs.filter(p => p.voltages.some(x => v.includes(x))); if (ph.length) xs = xs.filter(p => ph.includes(p.phase ?? ''));
    if (f.has('Validados en ficha 60 Hz')) xs = xs.filter(p => p.validated); if (f.has('Especificaciones pendientes')) xs = xs.filter(p => !p.validated);
    if (this.sort() === 'hp-asc') xs = [...xs].sort((a, b) => (a.hp ?? 99) - (b.hp ?? 99)); if (this.sort() === 'hp-desc') xs = [...xs].sort((a, b) => (b.hp ?? -1) - (a.hp ?? -1));
    return xs;
  });
  clear() { this.active.set(new Set()); }
  slugOf = (serie: string) => serie.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  toggle(label: string) { this.active.update(s => { const n = new Set(s); n.has(label) ? n.delete(label) : n.add(label); return n; }); }
}
