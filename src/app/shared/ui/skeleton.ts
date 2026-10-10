import { Component } from '@angular/core';
@Component({ selector: 'bsv-product-skeleton', host: { class: 'product-card', 'aria-hidden': 'true', 'data-component': 'ProductCard/Skeleton' },
  template: `<div class="skeleton sk-img"></div><div class="skeleton sk-line w40"></div><div class="skeleton sk-line w80"></div><div class="skeleton sk-line w60"></div><div class="skeleton sk-btn"></div>` })
export class ProductSkeleton {}
