import { Component, input } from '@angular/core';
import { Icon } from './icon';
@Component({
  selector: 'bsv-empty', imports: [Icon],
  host: { class: 'empty', 'data-component': 'EmptyState' },
  template: `<div class="icon"><bsv-icon [name]="icon()" style="--icon:30px" /></div><h3>{{ title() }}</h3><p><ng-content /></p><div class="actions"><ng-content select="[actions]" /></div>`,
})
export class Empty { icon = input('search'); title = input.required<string>(); }
