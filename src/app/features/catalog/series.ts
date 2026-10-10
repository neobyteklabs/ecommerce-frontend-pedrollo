import { Component, inject, input, computed, signal, afterNextRender, PLATFORM_ID, DestroyRef, ElementRef, effect, linkedSignal } from '@angular/core';
import { isPlatformBrowser, LowerCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SERIES } from '../../core/catalog';
import { seriesBySlug, familyOfSeries } from '../../core/resources';
import { ProductService, cutsVisible } from '../../core/products';
import { Icon, ImgSlot, ProductCard } from '../../shared/ui';
import { Reveal, Spotlight, CountUp } from '../../shared/directives/motion';
import { InlineMedia } from '../../shared/directives/inline-media';

/** Página de serie. Con contenido narrativo (SERIES) se muestra el formato tipo Apple;
 *  sin él, un formato genérico construido solo con el manifiesto: foto oficial, ficha 60 Hz y modelos. */
@Component({
  selector: 'bsv-series', imports: [RouterLink, LowerCasePipe, Icon, ImgSlot, ProductCard, Reveal, Spotlight, CountUp, InlineMedia],
  host: { 'data-page': 'Serie', class: 'block' },
  template: `
  @if (res(); as r) {
  <div class="sub-nav" data-component="ProductSubNav"><div class="container"><a class="name" href="#top">Serie {{ r.serie }}</a><nav>@for (s of sections(); track s.id) { <a [href]="'#' + s.id" [class.is-active]="active() === s.id">{{ s.name }}</a> }</nav>@if (products()[0]; as first) { <a class="btn" [routerLink]="['/producto', first.id]">Ver modelos</a> }</div></div>

  @if (c(); as c) {
  <section class="s-hero" id="top" data-component="SeriesHero">
    <bsv-img-slot [slot]="'serie-' + r.slug + '-hero · hero cinematográfico pendiente · 2560×1440'" [scene]="true" [eager]="true" [alt]="'Serie ' + r.serie + ', imagen representativa'" />
    @if (r.comercial.video; as vid) { <video class="hero-video" bsvInlineMedia [src]="vid" anchor=".s-hero" load="150vh" play="60vh" mode="play" [loop]="true" muted playsinline preload="none" aria-hidden="true"></video> }
    <div class="container copy-wrap"><div class="copy"><span class="kicker">{{ c.kicker }}</span><h1>{{ c.headline[0] }} <span class="grad">{{ c.headline[1] }}</span></h1><p class="sub">{{ c.sub }}</p><div class="row" style="margin-top:8px"><a class="btn-link" href="#detalle">Mira lo más destacado ›</a></div></div></div>
  </section>
  <div class="buy-pill" [class.is-shown]="pill()" data-component="BuyPill"><span><b>{{ r.n_productos_crm }} modelos</b> en catálogo BSV<small>Precio y disponibilidad por confirmar</small></span><a class="btn" href="#comparar">Comparar</a></div>

  <section class="s-section" style="padding-top:var(--space-6)" data-component="Highlights"><div class="container"><div class="highlights">@for (h of c.highlights; track h) { <a href="#especificaciones">{{ h }}</a> }</div></div></section>

  <section class="s-section" id="detalle" style="padding-top:0" data-component="DetailTabs"><div class="container">
    <div class="s-head"><span class="eyebrow" bsvReveal>Vista general</span><h2 bsvReveal [revealIndex]="1">Mírala a detalle.</h2></div>
    <div class="detail-tabs" role="tablist">@for (t of c.tabs; track t.name; let i = $index) { <button role="tab" [attr.aria-selected]="i === tab()" (click)="tab.set(i)">{{ t.name }}</button> }</div>
    <div class="detail">@let t = c.tabs[tab()]; <bsv-img-slot [slot]="t.slot" [scene]="true" [alt]="t.name" /><p><b>{{ t.name }}.</b> {{ t.text }}</p></div>
  </div></section>

  <section class="s-section light" id="rendimiento" data-component="Performance"><div class="container">
    <div class="s-head"><span class="eyebrow" bsvReveal>Rendimiento</span><h2 bsvReveal [revealIndex]="1">{{ c.perf.head }}</h2><p bsvReveal [revealIndex]="2">{{ c.perf.lead }}</p></div>
    <div class="stats">@for (s of c.perf.stats; track s.pre; let i = $index) { <div class="stat" bsvReveal [revealIndex]="i"><span class="pre">{{ s.pre }}</span><div class="big grad" bsvCountUp>{{ s.big }}</div><span class="post">{{ s.post }}</span><br /><span class="fn">{{ s.fn }}</span></div> }</div>
    <bsv-img-slot [slot]="'curva-' + r.slug + ' · curvas H-Q de la ficha 60 Hz · pendiente de recortar del PDF'" style="margin-top:var(--space-7);aspect-ratio:16/7;min-height:0;width:100%" bsvReveal />
    <p class="muted small" style="margin-top:12px">Curvas de prestaciones HS = 0 m, tolerancia según EN ISO 9906 Grado 3B. @if (r.tecnico.ficha_60hz) { <a [href]="r.tecnico.ficha_60hz" target="_blank" rel="noopener">Abrir ficha técnica 60 Hz (PDF)</a> }</p>
  </div></section>

  <section class="s-section" id="ingenieria" data-component="EngineeringBento"><div class="container">
    <div class="s-head"><span class="eyebrow" bsvReveal>Ingeniería</span><h2 bsvReveal [revealIndex]="1">{{ c.eng.head }}</h2><p bsvReveal [revealIndex]="2">{{ c.eng.lead }}</p></div>
    <div class="bento">@for (tl of c.eng.tiles; track tl.title; let i = $index) {
      <div class="tile" [class]="'tile w' + tl.w + (tl.tone ? ' ' + tl.tone : '')" bsvSpotlight bsvReveal="scale" [revealIndex]="i"><span class="eyebrow">{{ tl.eyebrow }}</span><h3>{{ tl.title }}</h3><p>{{ tl.text }}</p>@if (tl.slot) { <bsv-img-slot [slot]="tl.slot" /> }</div> }</div>
  </div></section>
  } @else {
  <section class="s-hero" id="top" data-component="SeriesHero">
    <bsv-img-slot [slot]="'serie-' + r.slug + '-hero · hero cinematográfico pendiente · 2560×1440'" [scene]="true" [eager]="true" [alt]="'Serie ' + r.serie + ', imagen representativa'" />
    <div class="container copy-wrap"><div class="copy"><span class="kicker">Serie {{ r.serie }} · {{ fam()?.nombre | lowercase }}</span><h1>Serie <span class="grad">{{ r.serie }}</span></h1><p class="sub">{{ r.n_productos_crm }} modelos en el catálogo BSV. Especificaciones tomadas de la ficha técnica 60 Hz; precio y disponibilidad por confirmar.</p></div></div>
  </section>
  <div class="buy-pill" [class.is-shown]="pill()" data-component="BuyPill"><span><b>{{ r.n_productos_crm }} modelos</b> en catálogo BSV<small>Precio y disponibilidad por confirmar</small></span><a class="btn" href="#comparar">Ver modelos</a></div>
  <section class="s-section light" id="detalle" data-component="SeriesOfficial"><div class="container">
    <div class="detail"><bsv-img-slot [slot]="'catalog-' + r.slug + ' · foto oficial de la serie pendiente'" [product]="true" [alt]="'Serie ' + r.serie + ', foto oficial'" style="background:#fff" bsvReveal="scale" />
      <div bsvReveal [revealIndex]="1"><span class="eyebrow">Recurso técnico</span><h2 style="margin-top:8px">Foto oficial y ficha 60 Hz</h2><p class="muted">La foto es la oficial de la serie en pedrollo.com.mx; representa a la serie, no a un modelo exacto. @if (r.tecnico.foto_oficial_fuente) { <a [href]="r.tecnico.foto_oficial_fuente" target="_blank" rel="noopener">Fuente</a> }</p>
        @if (r.tecnico.ficha_60hz) { <a class="download" [href]="r.tecnico.ficha_60hz" target="_blank" rel="noopener"><bsv-icon name="file" style="--icon:28px" /><div><strong>Ficha técnica {{ r.serie }} · 60 Hz</strong><span>PDF · México</span></div></a> } @else { <div class="alert alert-warning"><bsv-icon name="info" style="--icon:20px" /><div><strong>Sin ficha 60 Hz en el banco</strong>Placeholder: pendiente de conseguir la ficha técnica para México.</div></div> }
      </div></div>
  </div></section>
  }

  @if (sharedCuts().length) {
  <section class="s-section light" id="componentes" data-component="SeriesComponents"><div class="container">
    <div class="s-head"><span class="eyebrow" bsvReveal>Componentes</span><h2 bsvReveal [revealIndex]="1">Despiece, materiales y dimensiones.</h2><p bsvReveal [revealIndex]="2">Recortes fieles de la ficha técnica 60 Hz (página 4), comunes a la serie. @if (cutsPending()) { <span class="badge badge-warning no-dot">Pendiente de aprobación · modo revisión</span> }</p></div>
    <div class="grid md-grid-2" style="gap:var(--space-5)">@for (k of sharedCuts(); track k.key; let i = $index) { <figure style="margin:0" bsvReveal [revealIndex]="i"><bsv-img-slot [slot]="k.key + '-' + r.slug" [src]="k.path" [alt]="k.name + ' serie ' + r.serie" cls="technical" style="aspect-ratio:auto" /><figcaption class="xs muted" style="margin-top:6px">{{ k.name }} · ficha 60 Hz, página {{ k.page ?? '—' }}</figcaption></figure> }</div>
  </div></section>
  }
  @if (familyGallery().length) {
  <section class="s-section ivory" id="galeria" data-component="FamilyGallery"><div class="container">
    <div class="s-head"><span class="eyebrow" bsvReveal>Galería de familia</span><h2 bsvReveal [revealIndex]="1">De cerca.</h2><p bsvReveal [revealIndex]="2">Detalles recortados de la fotografía de referencia de la serie {{ r.serie }}, sin reconstrucción. Son referencia de familia, no fotografías verificadas de un modelo. @if (familyGalleryPending()) { <span class="badge badge-warning no-dot">Pendiente de revisión · modo revisión</span> }</p></div>
    <div class="grid grid-2 md-grid-4" style="gap:var(--space-4)">@for (a of familyGallery(); track a.path; let i = $index) { <figure style="margin:0" bsvReveal="scale" [revealIndex]="i"><bsv-img-slot [slot]="'mm-macro-' + r.slug + '-' + a.etiqueta" [src]="a.path" [product]="true" [alt]="a.etiqueta + ', serie ' + r.serie" style="aspect-ratio:1;background:#fff;border-radius:var(--radius-lg)" /><figcaption class="small" style="margin-top:8px;font-weight:600">{{ a.etiqueta }}</figcaption></figure> }</div>
  </div></section>
  }
  @if (products$.reviewMode() && reviewPreviews().length) {
  <section class="s-section light" id="revision" data-component="SeriesReviewPreviews"><div class="container">
    <div class="s-head"><span class="eyebrow">Lote de revisión · 60 Hz</span><h2>Vistas preliminares del PDF.</h2><p><span class="badge badge-warning no-dot">Pendiente de revisión · no publicable</span> Páginas completas del PDF original, sin modificar. La página de prestaciones es la primera detectada: no sustituye la curva de cada modelo.</p></div>
    @for (rv of reviewPreviews(); track rv.slug) {
      <div class="card" style="margin-bottom:var(--space-4)"><div class="between" style="flex-wrap:wrap;margin-bottom:12px"><div><strong>{{ rv.nombre }}</strong> <span class="muted small">· {{ rv.pdf_60hz }} · sha256 {{ rv.pdf_sha256_coincide ? 'verificado' : 'NO coincide' }} · comercial: {{ rv.estado_comercial }}</span></div>@if (rv.observaciones) { <span class="small muted">{{ rv.observaciones }}</span> }</div>
        <div class="grid md-grid-2" style="gap:var(--space-4)">
          <figure style="margin:0">@if (rv.preview_prestaciones) { <bsv-img-slot [slot]="'revision-prestaciones-' + rv.slug" [src]="rv.preview_prestaciones" cls="technical" [alt]="'Prestaciones ' + rv.nombre" style="aspect-ratio:auto" /><figcaption class="xs muted" style="margin-top:6px">Prestaciones · página {{ rv.pagina_prestaciones }} · vista preliminar</figcaption> } @else { <div class="img-slot technical" data-slot="sin página de prestaciones detectada" style="aspect-ratio:4/3"></div> }</figure>
          <figure style="margin:0">@if (rv.preview_componentes) { <bsv-img-slot [slot]="'revision-componentes-' + rv.slug" [src]="rv.preview_componentes" cls="technical" [alt]="'Componentes ' + rv.nombre" style="aspect-ratio:auto" /><figcaption class="xs muted" style="margin-top:6px">Características constructivas · página {{ rv.pagina_componentes }} · vista preliminar</figcaption> } @else { <div class="img-slot technical" data-slot="sin sección constructiva detectada · comprobar manualmente" style="aspect-ratio:4/3"></div> }</figure>
        </div></div>
    }
  </div></section>
  }
  <section class="s-section ivory" id="comparar" data-component="CompareModels"><div class="container">
    <div class="s-head"><span class="eyebrow" bsvReveal>Modelos</span><h2 bsvReveal [revealIndex]="1">{{ c()?.compare?.head ?? 'Modelos de la serie ' + r.serie }}</h2><p bsvReveal [revealIndex]="2">{{ c()?.compare?.lead ?? 'Modelos registrados en el CRM de BSV. Las especificaciones se validaron contra la ficha técnica 60 Hz; donde no aparecen, quedan pendientes.' }}</p></div>
    <div class="product-grid">@for (p of products(); track p.id; let i = $index) { <bsv-product-card [p]="p" bsvReveal="scale" [revealIndex]="i % 4" /> }</div>
    @if (r.modelos_en_ficha_60hz.length) { <p class="small muted" style="margin-top:var(--space-5)">Modelos que aparecen en la ficha 60 Hz: {{ r.modelos_en_ficha_60hz.join(' · ') }}.</p> }
  </div></section>

  @if (c(); as c) {
  <section class="s-section light" id="especificaciones" data-component="SpecsSummary"><div class="container">
    <div class="s-head"><span class="eyebrow" bsvReveal>Especificaciones</span><h2 bsvReveal [revealIndex]="1">Ficha técnica de la serie.</h2></div>
    <div class="grid md-grid-2" style="gap:var(--space-6)">@for (col of c.specs; track $index; let i = $index) { <table class="spec-table" bsvReveal [revealIndex]="i"><tbody>@for (row of col; track row[0]) { <tr><th>{{ row[0] }}</th><td>{{ row[1] }}</td></tr> }</tbody></table> }</div>
    <div class="row" style="margin-top:var(--space-5)">@if (r.tecnico.ficha_60hz) { <a class="download" [href]="r.tecnico.ficha_60hz" target="_blank" rel="noopener"><bsv-icon name="file" style="--icon:28px" /><div><strong>Ficha técnica {{ r.serie }} · 60 Hz</strong><span>PDF · México</span></div></a> }@for (o of r.tecnico.otros_pdf; track o) { <a class="download" [href]="o" target="_blank" rel="noopener"><bsv-icon name="file" style="--icon:28px" /><div><strong>{{ o.split('/').pop() }}</strong><span>PDF</span></div></a> }</div>
  </div></section>
  }
  <div class="container s-foot" data-component="Footnotes"><ol><li>Las especificaciones provienen de la ficha técnica Pedrollo 60 Hz incluida en el banco de imágenes. Los modelos sin coincidencia en la ficha se muestran con especificaciones pendientes.</li><li>Las imágenes cinematográficas (hero y banner) son recursos comerciales representativos de la serie; la foto principal de cada producto es la oficial de la serie.</li><li>Precios y disponibilidad: pendientes de la lista BSV. No se muestran valores estimados.</li></ol></div>
  } @else {
  <section class="container section"><h1>Serie no encontrada</h1><p class="muted">No hay una serie con ese identificador. <a routerLink="/categoria/centrifugas">Ver catálogo</a>.</p></section>
  }`,
})
export class Series {
  serie = input('2cp');
  products$ = inject(ProductService);
  reviewPreviews = computed(() => this.res()?.tecnico.revision ?? []);
  /** Macros del paquete multimedia: públicos solo si el paquete está aprobado; en revisión, etiquetados. */
  familyGallery = computed(() => (this.res()?.comercial.multimedia ?? []).filter(mm => mm.aprobado || this.products$.reviewMode()).flatMap(mm => mm.macro));
  familyGalleryPending = computed(() => (this.res()?.comercial.multimedia ?? []).some(mm => !mm.aprobado && mm.macro.length));
  res = computed(() => seriesBySlug(this.serie()));
  fam = computed(() => familyOfSeries(this.serie()));
  c = computed(() => SERIES[this.serie()] ?? null);
  products = computed(() => this.products$.bySeries(this.serie()));
  /** Recortes compartidos de la serie (despiece, características, dimensiones), publicables solo si todos los modelos con recortes están aprobados o en modo revisión. */
  cutsPending = computed(() => { const ms = this.res()?.modelos ?? []; return ms.some(m => m.recortes && !m.recortes.aprobado); });
  sharedCuts = computed(() => {
    const r = this.res(); const sc = r?.tecnico.recortes?.compartidos ?? {}; const anyCuts = (r?.modelos ?? []).some(m => m.recortes);
    if (!anyCuts || (this.cutsPending() && !this.products$.reviewMode())) return [];
    return [['despiece', 'Despiece y materiales'], ['caracteristicas', 'Características constructivas'], ['dimensiones', 'Dimensiones y pesos']].filter(([k]) => sc[k]?.path).map(([k, n]) => ({ key: k, name: n, path: sc[k].path!, page: sc[k].pdf_page }));
  });
  tab = linkedSignal<string, number>({ source: () => this.serie(), computation: () => 0 });
  pill = signal(false); active = signal<string | null>(null);
  sections = computed(() => [...(this.c() ? [{ id: 'detalle', name: 'Vista general' }, { id: 'rendimiento', name: 'Rendimiento' }, { id: 'ingenieria', name: 'Ingeniería' }] : [{ id: 'detalle', name: 'Ficha' }]), ...(this.sharedCuts().length ? [{ id: 'componentes', name: 'Componentes' }] : []), ...(this.familyGallery().length ? [{ id: 'galeria', name: 'Galería' }] : []), ...(this.products$.reviewMode() && this.reviewPreviews().length ? [{ id: 'revision', name: 'Revisión' }] : []), { id: 'comparar', name: 'Modelos' }, ...(this.c() ? [{ id: 'especificaciones', name: 'Especificaciones' }] : [])]);
  constructor() {
    const title = inject(Title);
    effect(() => { const r = this.res(); title.setTitle(r ? `Serie ${r.serie} · Pedrollo` : 'Serie · Pedrollo'); });
    const browser = isPlatformBrowser(inject(PLATFORM_ID)); const host = inject(ElementRef<HTMLElement>).nativeElement; const destroy = inject(DestroyRef);
    afterNextRender(() => {
      if (!browser) return;
      const onScroll = () => {
        const hero = host.querySelector('.s-hero') as HTMLElement | null; if (!hero) return;
        this.pill.set(scrollY > hero.offsetHeight * 0.55);
        let cur: string | null = null; this.sections().forEach(s => { const el = document.getElementById(s.id); if (el && el.getBoundingClientRect().top < innerHeight * 0.4) cur = s.id; }); this.active.set(cur);
      };
      addEventListener('scroll', onScroll, { passive: true }); onScroll();
      destroy.onDestroy(() => removeEventListener('scroll', onScroll));
    });
  }
}
