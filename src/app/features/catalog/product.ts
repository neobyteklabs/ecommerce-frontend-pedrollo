import { Component, inject, input, computed, signal, effect, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ProductService, availLabel, mxn, specLine, cutsVisible } from '../../core/products';
import { seriesBySlug } from '../../core/resources';
import { CartService } from '../../core/cart';
import { ToastService } from '../../core/toast';
import { BRAND } from '../../core/brand';
import { SERIES } from '../../core/catalog';
import { Icon, ImgSlot, ProductCard, Price, Qty, Alert } from '../../shared/ui';
import { Reveal } from '../../shared/directives/motion';

interface GalleryItem { slot: string; src: string | null; kind: 'catalog' | 'scene' | 'technical' | 'placeholder'; alt: string; caption: string; pending?: boolean; }

/** Ficha de producto. Galería por pestañas: Fotografía · Curvas de rendimiento · Componentes · Ficha técnica.
 *  Fotografía principal = foto oficial referencial de la serie (no verificada por modelo). Recortes técnicos tal cual
 *  vienen del paquete de la serie; los marcados "pendiente aprobacion" solo se ven en modo revisión. */
@Component({
  selector: 'bsv-product', imports: [RouterLink, Icon, ImgSlot, ProductCard, Price, Qty, Alert, Reveal],
  host: { class: 'container block', 'data-page': 'Producto' },
  template: `
  @if (p(); as p) {
  @if (!products.isPublishable(p)) {
    <section class="section"><bsv-alert kind="warning" title="Modelo no publicado">Este modelo aparece en la ficha técnica 60 Hz pero no está confirmado en el catálogo BSV. Visible solo en modo revisión.</bsv-alert></section>
  } @else {
  <nav aria-label="Migas de pan"><ol class="breadcrumb" data-component="Breadcrumb"><li><a routerLink="/">Inicio</a></li><li><a [routerLink]="['/categoria', p.family]">{{ p.familyName }}</a></li><li><a [routerLink]="['/serie', p.serie]">Serie {{ p.serieName }}</a></li><li aria-current="page">{{ p.model }}</li></ol></nav>
  @if (products.reviewMode()) { <bsv-alert kind="info" title="Modo revisión activo" style="margin-bottom:16px">Se muestran recursos pendientes de aprobación con etiqueta. Público no los ve. <a href="?revision=0">Salir</a></bsv-alert> }
  <div class="pdp">
    <div class="gallery" data-component="Gallery">
      <div class="gallery-tabs" role="tablist" data-component="GalleryTabs">@for (t of galleryTabs(); track t.id) { <button role="tab" type="button" [attr.aria-selected]="t.id === gtab()" [disabled]="!t.items.length" (click)="gtab.set(t.id); thumb.set(0)">{{ t.name }}@if (t.pending) { <span class="badge badge-warning no-dot" style="margin-left:6px">en revisión</span> }</button> }</div>
      @let items = currentItems();
      @if (items[thumb()]; as cur) {
        <bsv-img-slot cls="main" [slot]="cur.slot" [src]="cur.src" [product]="cur.kind === 'catalog'" [scene]="cur.kind === 'scene'" [class.technical]="cur.kind === 'technical'" [eager]="true" [alt]="cur.alt" />
        <p class="xs muted" style="margin:4px 0 0">{{ cur.caption }}@if (cur.pending) { <span class="badge badge-warning no-dot" style="margin-left:6px">Pendiente de aprobación</span> }</p>
        @if (items.length > 1) { <div class="thumbs">@for (it of items; track it.slot; let i = $index) { <bsv-img-slot [slot]="it.slot" [src]="it.src" [product]="it.kind === 'catalog'" [scene]="it.kind === 'scene'" [class.technical]="it.kind === 'technical'" [class.is-active]="i === thumb()" tabindex="0" role="button" [attr.aria-label]="it.caption" (click)="thumb.set(i)" (keydown.enter)="thumb.set(i)" /> }</div> }
      } @else {
        <div class="img-slot technical" [attr.data-slot]="emptyTabLabel()" style="aspect-ratio:4/3"></div>
      }
    </div>
    <div class="stack">
      <div>
        <div class="row" style="margin-bottom:8px"><span class="model" style="color:var(--color-primary);font-size:var(--text-lg)">{{ p.model }}</span>
          @if (p.validated) { <span class="badge badge-success">Ficha 60 Hz validada</span> } @else { <span class="badge badge-warning">Especificaciones pendientes</span> }
          @if (!p.enCrm) { <span class="badge badge-neutral no-dot">No confirmado en CRM</span> }</div>
        <h1 style="font-size:var(--text-2xl)">{{ p.name }}</h1>
        <p class="muted">{{ specLine(p) }} · Marca {{ brand.name }}@if (hasStory()) { · <a [routerLink]="['/serie', p.serie]">Conoce la serie {{ p.serieName }} ›</a> }</p>
      </div>
      <div class="buy-box" data-component="BuyBox">
        @if (p.price != null) { <bsv-price [total]="p.price" /> } @else {
          <div class="price-block"><span class="main" style="font-size:var(--text-2xl)">Precio por confirmar</span><span class="breakdown">Pendiente de la lista de precios BSV. Mientras tanto, cotiza con un asesor.</span></div> }
        <div class="small" style="display:flex;gap:8px;align-items:center"><bsv-icon [name]="p.avail === 'agotado' ? 'alert' : 'truck'" style="--icon:20px" /> {{ availLabel(p.avail) }}</div>
        @if (p.price != null && p.avail !== 'agotado') {
          <div class="row-qty"><label class="label">Cantidad</label><bsv-qty [(value)]="qty" /></div>
          <button class="btn btn-primary btn-lg btn-block" type="button" [class.is-loading]="adding()" (click)="add()"><bsv-icon name="cart" style="--icon:20px" /> Agregar al carrito</button>
        } @else {
          <a class="btn btn-primary btn-lg btn-block" [href]="'https://wa.me/525572589681?text=Hola, quiero cotizar ' + p.model"><bsv-icon name="phone" style="--icon:20px" /> Cotizar {{ p.model }}</a>
        }
        <a class="btn btn-ghost btn-block" [href]="'https://wa.me/525572589681?text=Hola, quiero cotizar ' + p.model"><bsv-icon name="phone" style="--icon:20px" /> ¿Compra por volumen? Habla con un asesor</a>
        <ul class="small muted" style="margin:0;padding-left:18px;display:grid;gap:4px"><li>Garantía de fábrica Pedrollo</li><li>Factura CFDI 4.0 desde tu cuenta</li><li>Envío asegurado a todo México</li></ul>
      </div>
    </div>
  </div>

  <section class="section" style="padding-top:32px">
    <div class="grid md-grid-2" style="gap:32px">
      <div bsvReveal><h3>Ficha técnica · 60 Hz · México</h3>
        @if (p.validated) {
        <table class="spec-table" data-component="SpecTable"><tbody>
          <tr><th scope="row">Modelo</th><td class="mono">{{ p.model }}</td></tr>
          <tr><th scope="row">Serie</th><td>{{ p.serieName }}</td></tr>
          <tr><th scope="row">Potencia</th><td>{{ p.hp != null ? p.hp + ' HP · ' + p.kw + ' kW' : '—' }}</td></tr>
          <tr><th scope="row">Fase</th><td>{{ p.phase || '—' }}</td></tr>
          <tr><th scope="row">Tensión (60 Hz)</th><td>{{ p.voltages.length ? p.voltages.join(' / ') : '—' }}</td></tr>
          <tr><th scope="row">Frecuencia</th><td>60 Hz · México</td></tr>
          <tr><th scope="row">Curvas y tablas</th><td>@if (cutsOk()) { Pestañas "Curvas de rendimiento" y "Ficha técnica" (página {{ p.cuts?.pdf_pagina_curva }} del PDF) } @else { <span class="ex">Ver la ficha técnica (PDF)</span> }</td></tr>
        </tbody></table>
        } @else {
        <bsv-alert kind="warning" title="Especificaciones pendientes">{{ p.nota || 'Este modelo del CRM no se localizó en la ficha técnica 60 Hz del banco. No se muestran datos estimados.' }}</bsv-alert>
        }
        @if (p.nota && p.validated) { <p class="small muted" style="margin-top:8px">{{ p.nota }}</p> }
      </div>
      <div class="stack" bsvReveal [revealIndex]="1">
        <div><h3>Descargas</h3><div class="stack-sm">
          @if (p.technical) { <a class="download" [href]="p.technical" target="_blank" rel="noopener" data-component="DownloadCard"><bsv-icon name="file" style="--icon:28px" /><div><strong>Ficha técnica {{ p.serieName }} · 60 Hz</strong><span>PDF · español · México · original sin modificar</span></div><bsv-icon name="download" style="margin-left:auto" /></a> }
          @else { <div class="download" style="opacity:.7"><bsv-icon name="file" style="--icon:28px" /><div><strong>Ficha técnica 60 Hz</strong><span>Placeholder · pendiente en el banco de recursos</span></div></div> }
          @for (o of otherPdfs(); track o) { <a class="download" [href]="o" target="_blank" rel="noopener"><bsv-icon name="file" style="--icon:28px" /><div><strong>{{ o.split('/').pop() }}</strong><span>PDF</span></div><bsv-icon name="download" style="margin-left:auto" /></a> }
        </div></div>
        <p class="xs muted">Fotografía principal: imagen oficial referencial de la serie {{ p.serieName }}; no es una fotografía verificada de este modelo. Recortes técnicos: tomados tal cual de la ficha 60 Hz, sin redibujo.</p>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0" data-component="Section/Relacionados">
    <div class="section-title" bsvReveal><h2>Otros modelos de la serie</h2></div>
    <div class="product-grid">@for (r of related(); track r.id; let i = $index) { <bsv-product-card [p]="r" bsvReveal="scale" [revealIndex]="i" /> }</div>
  </section>
  }
  } @else {
  <section class="section"><h1>Producto no encontrado</h1><p class="muted"><a routerLink="/categoria/centrifugas">Ver catálogo</a></p></section>
  }`,
})
export class ProductPage {
  id = input.required<string>();
  products = inject(ProductService); private cart = inject(CartService); toast = inject(ToastService); brand = inject(BRAND);
  p = computed(() => this.products.byId(this.id())); related = computed(() => this.products.related(this.id()));
  hasStory = computed(() => !!SERIES[this.p()?.serie ?? '']);
  series = computed(() => seriesBySlug(this.p()?.serie ?? ''));
  otherPdfs = computed(() => this.series()?.tecnico.otros_pdf ?? []);
  cutsOk = computed(() => cutsVisible(this.p()?.cuts, this.products.reviewMode()));
  gtab = linkedSignal<string, string>({ source: () => this.id(), computation: () => 'foto' });
  thumb = linkedSignal<string, number>({ source: () => this.gtab(), computation: () => 0 });

  /** Pestañas de galería. Cada recurso lleva su procedencia en el pie. */
  galleryTabs = computed(() => {
    const p = this.p(); if (!p) return [];
    const c = p.cuts; const rev = this.products.reviewMode(); const ok = cutsVisible(c, rev); const pend = !!c && !c.aprobado;
    const shared = this.series()?.tecnico.recortes?.compartidos ?? {};
    const foto: GalleryItem[] = [];
    if (c?.foto_modelo && c.foto_modelo_verificada) foto.push({ slot: `foto-${p.id}`, src: c.foto_modelo, kind: 'catalog', alt: `${p.model}, fotografía verificada`, caption: 'Fotografía verificada del modelo.' });
    foto.push({ slot: `catalog-${p.serie} · foto oficial referencial pendiente`, src: p.catalog, kind: 'catalog', alt: `Serie ${p.serieName}, imagen referencial`, caption: p.catalog ? 'Imagen referencial de la familia (pedrollo.com.mx). No es fotografía verificada de este modelo.' : 'Placeholder: imagen referencial pendiente.' });
    p.gallery.forEach((g, i) => foto.push({ slot: `serie-${p.serie}-${i === 0 ? 'hero' : 'banner'}`, src: g, kind: 'scene', alt: `Serie ${p.serieName}, imagen comercial`, caption: 'Imagen comercial representativa de la serie.' }));
    // Paquetes multimedia de familia (catálogo 1:1 + detalles macro). Publicables solo si están aprobados; en revisión, etiquetados.
    for (const mm of this.series()?.comercial.multimedia ?? []) {
      if (!(mm.aprobado || rev)) continue;
      const pendMM = !mm.aprobado;
      for (const a of mm.catalogo) foto.push({ slot: `mm-catalogo-${p.serie}`, src: a.path, kind: 'catalog', alt: `Serie ${p.serieName}, catálogo 1:1 (referencia de familia)`, caption: 'Catálogo 1:1 derivado de la foto de referencia de familia (re-codificación, sin edición). No es fotografía verificada de este modelo.', pending: pendMM });
      for (const a of mm.macro) foto.push({ slot: `mm-macro-${p.serie}-${a.etiqueta}`, src: a.path, kind: 'catalog', alt: `${a.etiqueta}, detalle de la serie ${p.serieName}`, caption: `Detalle macro · ${a.etiqueta} · recorte de la foto de referencia de familia (píxeles originales). No es fotografía verificada de este modelo.`, pending: pendMM });
    }
    if (!(c?.foto_modelo && c.foto_modelo_verificada)) foto.push({ slot: `foto-${p.id} · fotografía original del modelo · pendiente`, src: null, kind: 'placeholder', alt: '', caption: 'Placeholder: fotografía original específica del modelo, pendiente.' });
    const curvas: GalleryItem[] = ok ? ([
      { slot: `curva-${p.id}`, src: c!.curva, kind: 'technical' as const, alt: `Curvas de rendimiento ${p.model}`, caption: `Curvas H-Q, NPSH y P2 · ficha 60 Hz, página ${c!.pdf_pagina_curva ?? '—'} · recorte fiel del PDF. La gráfica incluye las variantes de su grupo; consultar la etiqueta ${p.model}.`, pending: pend },
      { slot: `tabla-${p.id}`, src: c!.tabla_prestaciones, kind: 'technical' as const, alt: `Tabla de prestaciones ${p.model}`, caption: 'Tabla de prestaciones HS = 0 m · ficha 60 Hz · recorte fiel del PDF.', pending: pend },
    ] as GalleryItem[]).filter(x => x.src) : [];
    const comp: GalleryItem[] = ok ? [['despiece', 'Despiece y materiales'], ['caracteristicas', 'Características constructivas'], ['dimensiones', 'Dimensiones y pesos']].filter(([k]) => shared[k]?.path).map(([k, n]) => ({ slot: `${k}-${p.serie}`, src: shared[k].path, kind: 'technical' as const, alt: `${n} serie ${p.serieName}`, caption: `${n} · común a la serie ${p.serieName} · ficha 60 Hz, página ${shared[k].pdf_page ?? '—'} · recorte fiel del PDF.`, pending: pend })) : [];
    const ficha: GalleryItem[] = ok && c!.tabla_consumos ? [{ slot: `consumos-${p.id}`, src: c!.tabla_consumos, kind: 'technical' as const, alt: `Consumos eléctricos ${p.model}`, caption: 'Tensiones y consumos (A) · ficha 60 Hz · recorte fiel del PDF.', pending: pend }] : [];
    // Lote global de revisión: páginas completas del PDF, solo en modo revisión y solo si no hay recortes de serie visibles.
    if (rev && !ok) {
      for (const rv of this.series()?.tecnico.revision ?? []) {
        if (rv.publicable === false || rv.estado_tecnico !== 'pendiente_revision') { /* pendiente: se muestra etiquetado */ }
        if (rv.preview_prestaciones) curvas.push({ slot: `revision-prestaciones-${rv.slug}`, src: rv.preview_prestaciones, kind: 'technical', alt: `Página de prestaciones ${rv.nombre}`, caption: `VISTA PRELIMINAR DE REVISIÓN · ${rv.pdf_60hz} · página ${rv.pagina_prestaciones}: primera página de prestaciones detectada. No es la curva específica de ${p.model}; elegir la página correcta antes de aprobar.`, pending: true });
        if (rv.preview_componentes) comp.push({ slot: `revision-componentes-${rv.slug}`, src: rv.preview_componentes, kind: 'technical', alt: `Página de componentes ${rv.nombre}`, caption: `VISTA PRELIMINAR DE REVISIÓN · ${rv.pdf_60hz} · página ${rv.pagina_componentes}: página identificada como características constructivas (sin modificar). ${rv.observaciones || ''}`.trim(), pending: true });
      }
    }
    return [
      { id: 'foto', name: 'Fotografía', items: foto, pending: foto.some(x => x.pending) },
      { id: 'curvas', name: 'Curvas de rendimiento', items: curvas, pending: curvas.some(x => x.pending) },
      { id: 'componentes', name: 'Componentes', items: comp, pending: comp.some(x => x.pending) },
      { id: 'ficha', name: 'Ficha técnica', items: ficha, pending: ok && pend },
    ];
  });
  currentItems = computed(() => this.galleryTabs().find(t => t.id === this.gtab())?.items ?? []);
  emptyTabLabel = computed(() => { const c = this.p()?.cuts; const lote = (this.series()?.tecnico.revision ?? []).length > 0; return (c && !c.aprobado) || lote ? (this.products.reviewMode() ? 'sin vista preliminar en el lote para esta pestaña' : 'recurso técnico en revisión · pendiente de aprobación') : 'recurso técnico pendiente'; });

  qty = signal(1); adding = signal(false);
  mxn = mxn; availLabel = availLabel; specLine = specLine;
  private title = inject(Title);
  private _t = effect(() => { const p = this.p(); if (p) this.title.setTitle(`${p.model} · ${p.name} · Pedrollo`); });
  add() { this.adding.set(true); setTimeout(() => { this.adding.set(false); this.cart.add(this.id(), this.qty()); this.toast.show(this.p()!.model + ' agregado al carrito', 'success', { href: '/carrito', label: 'Ver carrito' }); }, 600); }
}
