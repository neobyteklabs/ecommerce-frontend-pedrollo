import { Component, inject, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ProductService } from '../../core/products';
import { FAMILIES } from '../../core/catalog';
import { familyHero } from '../../core/resources';
import { StorefrontApi, StoreBanners } from '../../core/api/storefront-api';
import { cardFromSummary } from '../../core/api/storefront-view';
import { Icon, ImgSlot, ProductCard, ProductSkeleton, SeriesRail, SeriesRef } from '../../shared/ui';
import { seriesWithHero } from '../../core/images';
import { SERIES } from '../../core/catalog';
import { Reveal } from '../../shared/directives/motion';

const NO_BANNERS: StoreBanners = { hero: [], franja: [], 'banner-marca': [], categoria: {} };

@Component({
  selector: 'bsv-home', imports: [RouterLink, Icon, ImgSlot, ProductCard, ProductSkeleton, Reveal, SeriesRail],
  host: { 'data-page': 'Home' },
  template: `
  <section class="hero hero-center" data-component="Hero">
    <div class="container hero-inner">
      <div class="copy">
        <span class="eyebrow">Serie 2CP · Centrífugas de doble rodete</span>
        <h1>Dos rodetes. <span class="grad">El doble de presión.</span></h1>
        <p class="lead">Dos impulsores en serie: altura hasta 112 m y caudal hasta 450 l/min según la ficha 60 Hz.</p>
        <div class="row hero-links"><a class="btn-link" routerLink="/serie/2cp">Más información ›</a><a class="btn-link" routerLink="/producto/2cp-32-210a">Ver modelos ›</a></div>
      </div>
      <bsv-img-slot slot="hero-home" alt="Electrobomba Pedrollo 2CP sobre fondo negro con salpicaduras de agua" [scene]="true" [eager]="true" [banner]="banners().hero[0] ?? null" />
      <form class="hero-search" role="search" data-component="SearchBar/Hero" (submit)="go($event, hq.value)">
        <label class="sr-only" for="hq">Buscar producto</label>
        <div class="input-group"><bsv-icon name="search" style="--icon:20px" /><input #hq id="hq" type="search" placeholder="Modelo, HP o uso: PKm 60, 1 HP, pozo profundo…" /><button class="btn btn-primary btn-sm" type="submit">Buscar</button></div>
        <div class="hero-sug">Búsquedas frecuentes: <a routerLink="/buscar" [queryParams]="{ q: 'PKm 60' }">PKm 60</a><a routerLink="/buscar" [queryParams]="{ q: 'CPm 158' }">CPm 158</a><a routerLink="/buscar" [queryParams]="{ q: 'sumergible pozo' }">sumergible para pozo</a><a routerLink="/buscar" [queryParams]="{ q: 'presurizador' }">presurizador</a></div>
      </form>
    </div>
  </section>

  @if (banners().franja.length) {
  <section class="container" style="display:grid;gap:var(--space-3);padding-top:var(--space-5)" data-component="Section/Franja">
    @for (b of banners().franja; track $index) { <bsv-img-slot cls="franja" slot="franja" [banner]="b" [scene]="true" style="aspect-ratio:20/3;min-height:0;width:100%" /> }
  </section>
  }

  @if (seriesDestacadas.length) {
  <section class="section container" style="padding-bottom:0" data-component="Section/Series"><bsv-series-rail [series]="seriesDestacadas" title="Conoce las series" lead="Cada serie tiene su página: para qué sirve, qué entrega y todos sus modelos con precio." [wrap]="false" /></section>
  }

  <section class="section container" data-component="Section/Categorias">
    <div class="section-title" bsvReveal><div><span class="eyebrow">Catálogo</span><h2 style="margin-top:8px">Compra por categoría</h2></div><a routerLink="/categoria/centrifugas">Ver todo el catálogo</a></div>
    <div class="grid grid-2 md-grid-3 lg-grid-4">
      @for (c of cats; track c.slug; let i = $index) {
        <a class="cat-card" [routerLink]="['/categoria', c.slug]" bsvReveal [revealIndex]="i"><bsv-img-slot [slot]="'cat-' + c.slug + ' · foto representativa pendiente'" [product]="true" [alt]="c.name + ', foto representativa de la familia'" /><strong>{{ c.name }}</strong><span>{{ c.desc }}</span></a>
      }
    </div>
  </section>

  <section class="section container" style="padding-top:0" data-component="Section/Destacados">
    <div class="section-title" bsvReveal><div><span class="eyebrow">Selección</span><h2 style="margin-top:8px">Los más vendidos</h2></div><a routerLink="/categoria/multietapas">Ver más</a></div>
    <div class="product-grid">@for (p of featured(); track p.id; let i = $index) { <bsv-product-card [p]="p" bsvReveal="scale" [revealIndex]="i" /> }@if (featuredRes.isLoading()) { <bsv-product-skeleton /><bsv-product-skeleton /><bsv-product-skeleton /><bsv-product-skeleton /> }</div>
  </section>

  <section class="trust-band on-ink" data-component="Section/Confianza">
    <div class="container trust">
      <div class="trust-item" bsvReveal [revealIndex]="0"><bsv-icon name="shield" style="--icon:28px" /><div><strong>Distribuidor autorizado</strong><span>Garantía de fábrica y refacciones originales.</span></div></div>
      <div class="trust-item" bsvReveal [revealIndex]="1"><bsv-icon name="truck" style="--icon:28px" /><div><strong>Envío a todo México</strong><span>Existencia local sale en 24–48 h. Sobre pedido en 5–7 días.</span></div></div>
      <div class="trust-item" bsvReveal [revealIndex]="2"><bsv-icon name="receipt" style="--icon:28px" /><div><strong>Factura disponible</strong><span>CFDI 4.0 desde tu cuenta, sin llamar a nadie.</span></div></div>
    </div>
  </section>

  @if (promos().length) {
  <section class="section container" style="padding-top:0" data-component="Section/FamiliasPromo">
    <div class="section-title" bsvReveal><div><span class="eyebrow">Familias</span><h2 style="margin-top:8px">Una bomba para cada trabajo</h2></div></div>
    <div class="grid md-grid-2 lg-grid-4" style="gap:var(--space-4)">@for (pr of promos(); track pr.slug; let i = $index) {
      <a class="promo-tile" [routerLink]="['/categoria', pr.slug]" bsvReveal="scale" [revealIndex]="i"><bsv-img-slot [slot]="'familia-' + pr.slug + '-hero'" [src]="pr.hero.web" [scene]="true" [alt]="pr.name + ', imagen comercial de familia'" /><span class="promo-copy"><strong>{{ pr.name }}</strong>@if (pr.hero.pending) { <span class="badge badge-warning no-dot">en revisión</span> }</span></a> }</div>
  </section>
  }
  @if (marca(); as m) {
  <section class="section container" data-component="Section/BannerMarca"><div style="display:block" bsvReveal><bsv-img-slot class="banner-marca" slot="banner-marca" [banner]="m" [scene]="true" style="aspect-ratio:10/3;min-height:0;width:100%" /></div></section>
  } @else {
  <section class="section container" data-component="Section/BannerMarca"><a routerLink="/serie/2cp" style="display:block" bsvReveal><bsv-img-slot class="banner-marca" slot="banner-marca" alt="Pedrollo 2CP, electrobombas centrífugas de doble rodete" [scene]="true" style="aspect-ratio:16/9;min-height:0;width:100%" /></a></section>
  }`,
})
export class Home {
  products = inject(ProductService); private api = inject(StorefrontApi); private router = inject(Router);
  cats = FAMILIES;
  /** Series con hero ya instalado y contenido de página; la 2CP (campaña) va primero. */
  seriesDestacadas: SeriesRef[] = seriesWithHero().filter(x => SERIES[x]).sort((a, b) => (a === '2cp' ? -1 : b === '2cp' ? 1 : 0)).slice(0, 12).map(x => ({ slug: x, name: SERIES[x].name.replace(/^Serie /, '') }));
  /** Bala 11: banners del admin por hueco. Sin respuesta (o vacíos), la home queda como siempre: el manifiesto estático es el respaldo. */
  private bannersRes = this.api.banners();
  banners = computed<StoreBanners>(() => this.bannersRes.hasValue() ? this.bannersRes.value() : NO_BANNERS);
  /** El banner de marca; sin enlace propio, va a la serie de la campaña como el hueco fijo. */
  marca = computed(() => { const b = this.banners()['banner-marca'][0]; return b ? { ...b, enlace: b.enlace ?? '/serie/2cp' } : null; });
  /** Destacados desde la API (bala F1): la campaña activa es la 2CP, así que manda MULTIETAPAS hasta que exista `destacado`. */
  featuredRes = this.api.products(() => ({ familia: 'multietapas', orden: 'serie', size: 8 }));
  featured = computed(() => this.featuredRes.hasValue() ? this.featuredRes.value().content.map(cardFromSummary) : []);
  promos = computed(() => FAMILIES.map(f => ({ slug: f.slug, name: f.name, hero: familyHero(f.slug, this.products.reviewMode()) })).filter((x): x is { slug: string; name: string; hero: NonNullable<ReturnType<typeof familyHero>> } => !!x.hero));
  go(e: Event, q: string) { e.preventDefault(); this.router.navigate(['/buscar'], { queryParams: { q } }); }
}
