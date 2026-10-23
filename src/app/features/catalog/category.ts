import { Component, inject, input, signal, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ProductService } from '../../core/products';
import { StorefrontApi, ListingOrder } from '../../core/api/storefront-api';
import { cardFromSummary } from '../../core/api/storefront-view';
import { Icon, ProductCard, ProductSkeleton, Empty } from '../../shared/ui';
import { Reveal } from '../../shared/directives/motion';
import { familyBySlug, FAMILIES } from '../../core/catalog';
import { familyHero } from '../../core/resources';
import { ImgSlot } from '../../shared/ui';

const PAGE = 24;
const ORDERS: ListingOrder[] = ['serie', 'hp-asc', 'hp-desc', 'precio-asc', 'precio-desc'];

/** Categoría = familia del catálogo. Desde la bala F1 lista, filtra y ordena desde la API de tienda; los filtros
 *  activos viajan en la URL (?serie=&hp=&tension=&fase=&orden=) para que una búsqueda filtrada se pueda compartir. */
@Component({
  selector: 'bsv-category', imports: [RouterLink, Icon, ProductCard, ProductSkeleton, Empty, Reveal, ImgSlot],
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
  <h1 style="font-size:var(--text-2xl)">{{ cat().name }} <span class="muted" style="font-weight:500;font-size:var(--text-lg)">· {{ total() }} modelos</span></h1>
  }
  @if (serie()) { <p class="small"><a [routerLink]="['/serie', serie()]">Ver página de la serie {{ serieName() }} ›</a></p> }
  <p class="muted" style="max-width:70ch">{{ cat().desc }} Especificaciones del catálogo BSV; disponibilidad por confirmar.</p>
  <div class="chip-list" style="margin-bottom:24px" data-component="SeriesChips">@for (sr of seriesList(); track sr.slug) { <button class="chip" type="button" [attr.aria-pressed]="serie() === sr.slug" (click)="set('serie', serie() === sr.slug ? null : sr.slug)">{{ sr.name }} <span class="muted">({{ sr.count }})</span></button> }</div>
  <div class="catalog">
    <aside class="filters" [class.is-open]="open()" id="filters" data-component="FilterPanel" aria-label="Filtros">
      <div class="between hide-desktop" style="margin-bottom:8px"><strong>Filtros</strong><button class="btn btn-ghost btn-icon" type="button" aria-label="Cerrar filtros" (click)="open.set(false)"><bsv-icon name="x" /></button></div>
      @for (g of groups(); track g.key) {
        <details class="filter-group" [open]="true"><summary>{{ g.name }}</summary>
          @for (o of g.options; track o.value) { <label class="check"><input type="checkbox" [checked]="g.active === o.value" (change)="set(g.key, g.active === o.value ? null : o.value)" /> {{ o.label }} <span class="muted">({{ o.n }})</span></label> }
        </details>
      }
      <div class="hide-desktop" style="padding-top:16px"><button class="btn btn-primary btn-block" type="button" (click)="open.set(false)">Ver {{ total() }} resultados</button></div>
    </aside>
    <div>
      <div class="catalog-toolbar" data-component="CatalogToolbar">
        <div class="chip-list" data-component="ActiveChips">
          @for (a of activeChips(); track a.key) { <button class="chip" aria-pressed="true" type="button" (click)="set(a.key, null)">{{ a.label }} <bsv-icon name="x" style="--icon:16px" /></button> }
          @if (activeChips().length) { <button class="chip chip-clear" type="button" (click)="clear()">Limpiar filtros</button> }
        </div>
        <div class="row">
          <button class="btn btn-secondary btn-sm hide-desktop" type="button" style="min-height:44px" (click)="open.set(true)"><bsv-icon name="filter" style="--icon:20px" /> Filtros ({{ activeChips().length }})</button>
          <label class="sr-only" for="sort">Ordenar</label>
          <select id="sort" class="select" style="width:auto;min-height:44px" [value]="order()" (change)="set('orden', $any($event.target).value)">
            <option value="serie">Por serie</option><option value="hp-asc">Potencia: menor a mayor</option><option value="hp-desc">Potencia: mayor a menor</option><option value="precio-asc">Precio: menor a mayor</option><option value="precio-desc">Precio: mayor a menor</option>
          </select>
        </div>
      </div>
      @if (list.error()) {
        <bsv-empty icon="alert" title="No pudimos cargar el catálogo" data-component="EmptyState/SinConexion">La tienda no respondió. Intenta de nuevo en un momento o cotiza con un asesor.
          <ng-container actions><a class="btn btn-secondary" href="https://wa.me/525572589681"><bsv-icon name="phone" style="--icon:20px" /> Pedir cotización</a></ng-container></bsv-empty>
      } @else {
      <div class="product-grid">
        @for (p of items(); track p.id; let i = $index) { <bsv-product-card [p]="p" bsvReveal="scale" [revealIndex]="i % 4" /> }
        @if (list.isLoading()) { <bsv-product-skeleton /><bsv-product-skeleton /><bsv-product-skeleton /><bsv-product-skeleton /> }
      </div>
      @if (!list.isLoading() && !items().length) {
        <bsv-empty icon="search" title="Sin modelos con estos filtros" data-component="EmptyState/Categoria">Quita algún filtro o pide una cotización: BSV también surte equipos sobre pedido.
          <ng-container actions><button class="btn btn-secondary" type="button" (click)="clear()">Limpiar filtros</button></ng-container></bsv-empty>
      }
      @if (hasMore()) { <div style="display:flex;justify-content:center;margin-top:24px"><button class="btn btn-secondary" type="button" [class.is-loading]="list.isLoading()" (click)="pages.set(pages() + 1)">Ver más ({{ total() - items().length }} restantes)</button></div> }
      }
    </div>
  </div>`,
})
export class Category {
  slug = input('centrifugas');
  /** Filtros desde la URL (withComponentInputBinding): ?serie=&hp=&tension=&fase=&orden= */
  serie = input<string | null>(null); hp = input<string | null>(null); tension = input<string | null>(null); fase = input<string | null>(null); orden = input<string | null>(null);
  private products = inject(ProductService); private api = inject(StorefrontApi); private router = inject(Router);
  open = signal(false); pages = signal(1);
  hero = computed(() => familyHero(this.slug(), this.products.reviewMode()));
  cat = computed(() => familyBySlug(this.slug()) ?? FAMILIES[0]);
  order = computed<ListingOrder>(() => (ORDERS as string[]).includes(this.orden() ?? '') ? this.orden() as ListingOrder : 'serie');

  series = this.api.series(() => this.slug());
  seriesList = computed(() => this.series.hasValue() ? this.series.value() : []);
  serieName = computed(() => this.seriesList().find(s => s.slug === this.serie())?.name ?? this.serie());
  facetsRes = this.api.facets(() => ({ familia: this.slug(), serie: this.serie() ?? undefined }));
  list = this.api.products(() => ({ familia: this.slug(), serie: this.serie() ?? undefined, hp: this.hp() ?? undefined, tension: this.tension() ?? undefined, fase: this.fase() ?? undefined, orden: this.order(), size: Math.min(PAGE * this.pages(), 100), page: 0 }));

  items = computed(() => this.list.hasValue() ? this.list.value().content.map(cardFromSummary) : []);
  total = computed(() => this.list.hasValue() ? this.list.value().totalElements : 0);
  hasMore = computed(() => this.list.hasValue() && this.items().length < this.total() && this.items().length < 100);
  groups = computed(() => {
    const f = this.facetsRes.hasValue() ? this.facetsRes.value() : null; if (!f) return [];
    return [
      { key: 'hp', name: 'Potencia (HP)', active: this.hp(), options: f.hp.map(v => ({ value: v.value, label: `${v.value} HP`, n: v.count })) },
      { key: 'tension', name: 'Tensión (60 Hz)', active: this.tension(), options: f.tension.map(v => ({ value: v.value, label: `${v.value} V`, n: v.count })) },
      { key: 'fase', name: 'Fase', active: this.fase(), options: f.fase.map(v => ({ value: v.value, label: v.value, n: v.count })) },
    ].filter(g => g.options.length);
  });
  activeChips = computed(() => [
    this.hp() ? { key: 'hp', label: `${this.hp()} HP` } : null, this.tension() ? { key: 'tension', label: `${this.tension()} V` } : null, this.fase() ? { key: 'fase', label: this.fase()! } : null,
  ].filter((x): x is { key: string; label: string } => !!x));

  /** Los filtros viven en la URL: cambiar uno es navegar con el query actualizado (y volver a la primera página). */
  set(key: string, value: string | null) { this.pages.set(1); this.router.navigate([], { queryParams: { [key]: value || null }, queryParamsHandling: 'merge', replaceUrl: true }); }
  clear() { this.pages.set(1); this.router.navigate([], { queryParams: { hp: null, tension: null, fase: null }, queryParamsHandling: 'merge', replaceUrl: true }); }
}
