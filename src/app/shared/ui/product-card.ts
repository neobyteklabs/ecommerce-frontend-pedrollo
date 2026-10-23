import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { availLabel, mxn } from '../../core/products';
import { CardItem } from '../../core/api/storefront-view';
import { ImgSlot } from './img-slot';
import { Icon } from './icon';
import { Spotlight, Reveal } from '../directives/motion';

/** Card de producto. Imagen principal = foto oficial (técnica) de la serie; nunca la cinematográfica.
 *  Recibe un CardItem: desde la API (listados) o desde el catálogo local (relacionados), ver core/api/storefront-view.ts. */
@Component({
  selector: 'bsv-product-card',
  imports: [RouterLink, ImgSlot, Icon],
  hostDirectives: [Spotlight, { directive: Reveal, inputs: ['bsvReveal', 'revealIndex'] }],
  host: { class: 'product-card', 'data-component': 'ProductCard', '[class.is-unavailable]': 'p().avail === "agotado"' },
  template: `
    <a class="absolute inset-0 z-10" [routerLink]="['/producto', p().id]" [attr.aria-label]="p().model + ' ' + p().name"></a>
    <bsv-img-slot [slot]="'catalog-' + p().serie + ' · foto oficial pendiente'" [src]="p().catalog" [product]="true" [alt]="'Serie ' + p().serieName + ' (foto oficial de la serie)'" />
    <span class="model">{{ p().model }}</span>
    <span class="name">{{ p().name }}</span>
    <span class="specs" [class.muted]="p().specsPending">{{ p().specs }}</span>
    @if (p().price != null) {
      <span class="price">{{ mxn(p().price) }} <small>IVA incl.</small>@if (p().before != null) { <s class="muted" style="margin-left:6px;font-weight:400">{{ mxn(p().before) }}</s> }</span>
      @if (p().promoLabel) { <span class="badge badge-success no-dot">{{ p().promoLabel }}</span> }
    } @else { <span class="price price-pending">Precio por confirmar <small>cotiza con un asesor</small></span> }
    <span class="avail">{{ availLabel(p().avail) }}</span>
    <span class="cta">Ver producto <bsv-icon name="arrowRight" /></span>`,
})
export class ProductCard { p = input.required<CardItem>(); mxn = mxn; availLabel = availLabel; }
