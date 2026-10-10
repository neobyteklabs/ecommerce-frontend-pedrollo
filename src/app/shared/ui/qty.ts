import { Component, model } from '@angular/core';
@Component({
  selector: 'bsv-qty',
  host: { class: 'qty', 'data-component': 'QuantitySelector' },
  template: `<button type="button" aria-label="Menos" (click)="set(value() - 1)">−</button><input type="number" min="1" [value]="value()" aria-label="Cantidad" (change)="set(+$any($event.target).value)" /><button type="button" aria-label="Más" (click)="set(value() + 1)">+</button>`,
})
export class Qty { value = model(1); set(v: number) { this.value.set(Math.max(1, v || 1)); } }
