import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, availLabel, mxn, specLine } from '../../core/products';
import { ImgSlot } from './img-slot';
import { Icon } from './icon';
import { Spotlight, Reveal } from '../directives/motion';

/** Card de producto. Imagen principal = foto oficial (técnica) de la serie; nunca la cinematográfica. */
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
    <span class="specs" [class.muted]="!p().validated">{{ specLine(p()) }}</span>
    @if (p().price != null) { <span class="price">{{ mxn(p().price) }} <small>IVA incl.</small></span> } @else { <span class="price price-pending">Precio por confirmar <small>lista BSV pendiente</small></span> }
    <span class="avail">{{ availLabel(p().avail) }}</span>
    <span class="cta">Ver producto <bsv-icon name="arrowRight" /></span>`,
})
export class ProductCard { p = input.required<Product>(); mxn = mxn; availLabel = availLabel; specLine = specLine; }
