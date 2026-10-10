import { Component, input, computed } from '@angular/core';
import { IVA, mxn } from '../../core/products';
import { Icon } from './icon';
@Component({
  selector: 'bsv-price', imports: [Icon],
  host: { class: 'price-block', 'data-component': 'Price' },
  template: `
    <span class="main">{{ mxn(total()) }} <span class="small muted" style="font-family:var(--font-body);font-weight:500">MXN</span></span>
    <span class="breakdown">IVA incluido · {{ mxn(base()) }} + {{ mxn(iva()) }} IVA</span>
    <details><summary>Ver desglose <bsv-icon name="chevronDown" style="--icon:16px" /></summary>
      <div class="lines"><span>Precio base</span><span class="num">{{ mxn(base()) }}</span><span>IVA 16 %</span><span class="num">{{ mxn(iva()) }}</span><span><strong>Total</strong></span><span class="num"><strong>{{ mxn(total()) }}</strong></span></div></details>`,
})
export class Price { total = input.required<number>(); base = computed(() => this.total() / (1 + IVA)); iva = computed(() => this.total() - this.base()); mxn = mxn; }
