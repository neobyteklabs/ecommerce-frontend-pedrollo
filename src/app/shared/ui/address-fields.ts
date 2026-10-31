import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderAddress } from '../../core/api/storefront-api';
import { ESTADOS_MX } from '../../core/address';

/** Los campos de una dirección de entrega (mismos nombres y autocompletado que el checkout). `showErrors` marca los obligatorios vacíos. */
@Component({
  selector: 'bsv-address-fields', imports: [FormsModule],
  host: { class: 'grid md-grid-2', style: 'gap:12px', 'data-component': 'AddressFields' },
  template: `
    <div class="field" [class.has-error]="showErrors() && !/^\\d{5}$/.test(a().cp.trim())"><label [for]="id('cp')">Código postal *</label><input [id]="id('cp')" class="input" name="cp" inputmode="numeric" maxlength="5" [ngModel]="a().cp" (ngModelChange)="set('cp', $event)" autocomplete="postal-code" /><span class="error-msg">5 dígitos.</span></div>
    <div class="field"><label [for]="id('estado')">Estado *</label><select [id]="id('estado')" class="select" name="estado" [ngModel]="a().estado" (ngModelChange)="set('estado', $event)">@for (e of estados; track e) { <option [value]="e">{{ e }}</option> }</select></div>
    <div class="field" style="grid-column:1/-1" [class.has-error]="showErrors() && !a().calle.trim()"><label [for]="id('calle')">Calle *</label><input [id]="id('calle')" class="input" name="calle" [ngModel]="a().calle" (ngModelChange)="set('calle', $event)" autocomplete="address-line1" maxlength="200" /><span class="error-msg">Escribe la calle.</span></div>
    <div class="field" [class.has-error]="showErrors() && !a().numeroExt.trim()"><label [for]="id('next')">Número exterior *</label><input [id]="id('next')" class="input" name="numeroExt" [ngModel]="a().numeroExt" (ngModelChange)="set('numeroExt', $event)" maxlength="20" /><span class="error-msg">Obligatorio.</span></div>
    <div class="field"><label [for]="id('nint')">Número interior</label><input [id]="id('nint')" class="input" name="numeroInt" [ngModel]="a().numeroInt ?? ''" (ngModelChange)="set('numeroInt', $event)" maxlength="20" /></div>
    <div class="field" [class.has-error]="showErrors() && !a().colonia.trim()"><label [for]="id('col')">Colonia *</label><input [id]="id('col')" class="input" name="colonia" [ngModel]="a().colonia" (ngModelChange)="set('colonia', $event)" autocomplete="address-level3" maxlength="120" /><span class="error-msg">Escribe la colonia.</span></div>
    <div class="field" [class.has-error]="showErrors() && !a().municipio.trim()"><label [for]="id('mun')">Municipio / alcaldía *</label><input [id]="id('mun')" class="input" name="municipio" [ngModel]="a().municipio" (ngModelChange)="set('municipio', $event)" autocomplete="address-level2" maxlength="120" /><span class="error-msg">Escribe el municipio.</span></div>
    <div class="field" style="grid-column:1/-1"><label [for]="id('ref')">Referencias <span class="muted" style="font-weight:400">(opcional)</span></label><input [id]="id('ref')" class="input" name="referencias" [ngModel]="a().referencias ?? ''" (ngModelChange)="set('referencias', $event)" placeholder="Portón negro, entre Av. Gustavo Baz y calle 5" maxlength="300" /></div>`,
})
export class AddressFields {
  a = model.required<OrderAddress>(); showErrors = input(false); prefix = input('addr');
  estados = ESTADOS_MX;
  id(k: string) { return `${this.prefix()}-${k}`; }
  set<K extends keyof OrderAddress>(k: K, v: OrderAddress[K]) { this.a.set({ ...this.a(), [k]: v }); }
}
