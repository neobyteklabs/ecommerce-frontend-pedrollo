import { Component, input, computed } from '@angular/core';
import { imageFor } from '../../core/images';
/** Hueco de imagen con nombre. Resuelve la imagen desde core/images.ts por el nombre del hueco,
 *  o recibe [src] explícito. [scene]=true para fotos con fondo propio (cover en vez de contain). */
@Component({
  selector: 'bsv-img-slot',
  host: { '[class]': 'classes()', '[attr.data-slot]': 'slot()' },
  template: `@if (url(); as u) { <img [src]="u" [alt]="alt()" [attr.loading]="eager() ? 'eager' : 'lazy'" [attr.fetchpriority]="eager() ? 'high' : null" decoding="async" /> }`,
})
export class ImgSlot {
  slot = input.required<string>(); src = input<string | null>(null); alt = input(''); product = input(false); scene = input(false); eager = input(false);
  /** Clase extra (el host usa [class] completo, así que class="x" estático no se mezcla). */
  cls = input('');
  url = computed(() => this.src() ?? imageFor(this.slot()));
  classes = computed(() => ['img-slot', this.cls(), this.product() && 'product', this.scene() && 'scene', this.url() && 'has-img'].filter(Boolean).join(' '));
}
