import { Component, input } from '@angular/core';
import { Icon } from './icon';
@Component({
  selector: 'bsv-alert', imports: [Icon],
  host: { class: 'alert', '[class]': '"alert alert-" + kind()', role: 'status' },
  template: `<bsv-icon [name]="icon() || (kind() === 'danger' ? 'alert' : kind() === 'success' ? 'check' : 'info')" style="--icon:20px" /><div>@if (title()) { <strong>{{ title() }}</strong> }<ng-content /></div>`,
})
export class Alert { kind = input<'info' | 'success' | 'warning' | 'danger'>('info'); title = input(''); icon = input(''); }
