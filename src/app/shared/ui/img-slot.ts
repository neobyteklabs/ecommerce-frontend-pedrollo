import { Component, input, computed } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { imageFor } from '../../core/images';
import { StoreBanner } from '../../core/api/storefront-api';
/** Hueco de imagen con nombre. Resuelve la imagen desde core/images.ts por el nombre del hueco,
 *  o recibe [src] explícito. [scene]=true para fotos con fondo propio (cover en vez de contain).
 *  Bala 11: con [banner] pinta el banner del admin (`<picture>` con la versión móvil si la hay, y enlace si trae) e ignora el manifiesto;
 *  sin banner, exactamente como antes. El enlace va DENTRO del host (el host sigue siendo el hijo directo de su contenedor: los estilos y la animación del hero dependen de eso). */
@Component({
  selector: 'bsv-img-slot',
  imports: [NgTemplateOutlet, RouterLink],
  host: { '[class]': 'classes()', '[attr.data-slot]': 'slot()' },
  template: `
    <ng-template #pic let-b><picture>@if (b.urlMovil) { <source media="(max-width: 767px)" [srcset]="b.urlMovil" /> }<img [src]="b.url" [alt]="b.alt" [attr.loading]="eager() ? 'eager' : 'lazy'" [attr.fetchpriority]="eager() ? 'high' : null" decoding="async" /></picture></ng-template>
    @if (banner(); as b) {
      @if (b.enlace; as l) {
        @if (external(l)) { <a class="banner-link" style="position:absolute;inset:0" [href]="l" target="_blank" rel="noopener"><ng-container [ngTemplateOutlet]="pic" [ngTemplateOutletContext]="{ $implicit: b }" /></a> }
        @else { <a class="banner-link" style="position:absolute;inset:0" [routerLink]="l"><ng-container [ngTemplateOutlet]="pic" [ngTemplateOutletContext]="{ $implicit: b }" /></a> }
      } @else { <ng-container [ngTemplateOutlet]="pic" [ngTemplateOutletContext]="{ $implicit: b }" /> }
    } @else if (url(); as u) { <img [src]="u" [alt]="alt()" [attr.loading]="eager() ? 'eager' : 'lazy'" [attr.fetchpriority]="eager() ? 'high' : null" decoding="async" /> }`,
})
export class ImgSlot {
  slot = input.required<string>(); src = input<string | null>(null); alt = input(''); product = input(false); scene = input(false); eager = input(false);
  /** Banner del admin (bala 11). Con banner manda sobre `src` y el manifiesto. */
  banner = input<StoreBanner | null>(null);
  /** Clase extra (el host usa [class] completo, así que class="x" estático no se mezcla). */
  cls = input('');
  url = computed(() => this.banner()?.url ?? this.src() ?? imageFor(this.slot()));
  classes = computed(() => ['img-slot', this.cls(), this.product() && 'product', this.scene() && 'scene', this.url() && 'has-img'].filter(Boolean).join(' '));
  external = (l: string) => l.startsWith('https://');
}
