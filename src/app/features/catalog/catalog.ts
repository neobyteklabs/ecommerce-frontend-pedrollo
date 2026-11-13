import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FAMILIES } from '../../core/catalog';
import { ImgSlot } from '../../shared/ui';
import { Reveal } from '../../shared/directives/motion';

/** El catálogo completo: las doce familias. Es a donde llevan «Ver todo el catálogo» y la miga «Catálogo» (antes iban a Centrífugas). */
@Component({
  selector: 'bsv-catalog', imports: [RouterLink, ImgSlot, Reveal],
  host: { class: 'container section block', style: 'padding-top:16px;display:block', 'data-page': 'Catalogo' },
  template: `
  <nav aria-label="Migas de pan"><ol class="breadcrumb" data-component="Breadcrumb"><li><a routerLink="/">Inicio</a></li><li aria-current="page">Catálogo</li></ol></nav>
  <h1 style="font-size:var(--text-2xl)">Catálogo Pedrollo</h1>
  <p class="muted" style="max-width:70ch">Todas las familias de bombas, equipos de presión y accesorios. Elige una para ver sus series y modelos con precio.</p>
  <div class="grid grid-2 md-grid-3 lg-grid-4" style="margin-top:24px">
    @for (c of cats; track c.slug; let i = $index) {
      <a class="cat-card" [routerLink]="['/categoria', c.slug]" bsvReveal [revealIndex]="i"><bsv-img-slot [slot]="'cat-' + c.slug + ' · foto representativa pendiente'" [product]="true" [alt]="c.name + ', foto representativa de la familia'" /><strong>{{ c.name }}</strong><span>{{ c.desc }}</span></a>
    }
  </div>`,
})
export class Catalog { cats = FAMILIES; }
