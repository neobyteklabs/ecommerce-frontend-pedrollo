import { Component, input } from '@angular/core';
@Component({
  selector: 'bsv-stepper',
  host: { 'data-component': 'CheckoutStepper' },
  template: `<ol class="stepper">@for (s of steps(); track s; let i = $index) { <li [class.is-done]="i + 1 < current()" [class.is-current]="i + 1 === current()"><span>{{ s }}</span></li> }</ol>`,
})
export class Stepper { steps = input<string[]>(['Dirección y envío', 'Pago', 'Confirmación']); current = input(1); }
