import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, Alert, Timeline } from '../../shared/ui';
import { AccountNav } from './account-nav';

@Component({
  selector: 'bsv-invoice', imports: [RouterLink, Icon, Alert, Timeline, AccountNav],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'SolicitarFactura' },
  template: `<div class="account-layout"><bsv-account-nav /><div class="stack" style="max-width:720px">
    <div><h1 style="font-size:var(--text-2xl);margin-bottom:4px">Solicitar factura</h1><span class="muted small">Pedido <span class="mono">BSV-24-01837</span> · $13,580.00 · 8 oct 2026</span></div>
    <bsv-alert kind="info">La factura la timbra nuestro equipo de contabilidad en un máximo de 2 días hábiles y te llega por correo. Puedes solicitarla hasta el último día del mes de tu compra.</bsv-alert>
    @if (!sent()) {
    <form class="card stack" data-component="InvoiceForm" (submit)="$event.preventDefault(); sent.set(true)">
      <label class="check" style="min-height:36px"><input type="checkbox" [checked]="saved()" (change)="saved.set($any($event.target).checked)" /> Usar mis datos fiscales guardados (MEHL850612QA3)</label>
      <div class="grid md-grid-2">
        <div class="field"><label for="rfc">RFC</label><input id="rfc" class="input mono" value="MEHL850612QA3" [disabled]="saved()" required /></div>
        <div class="field"><label for="rs">Razón social</label><input id="rs" class="input" value="LAURA MENDOZA HERNÁNDEZ" [disabled]="saved()" required /></div>
        <div class="field"><label for="cp">Código postal fiscal</label><input id="cp" class="input" value="54060" inputmode="numeric" [disabled]="saved()" required /></div>
        <div class="field"><label for="reg">Régimen fiscal</label><select id="reg" class="select" [disabled]="saved()"><option>612 · Actividades empresariales</option><option>601 · General de ley PM</option><option>626 · RESICO</option></select></div>
        <div class="field"><label for="uso">Uso de CFDI</label><select id="uso" class="select" required><option>G03 · Gastos en general</option><option>G01 · Adquisición de mercancías</option><option>S01 · Sin efectos fiscales</option></select></div>
        <div class="field"><label for="mail">Correo para recibirla</label><input id="mail" class="input" type="email" value="contabilidad@tallermendoza.mx" required /></div>
      </div>
      <div class="field"><label for="obs">Comentarios para contabilidad <span class="muted" style="font-weight:400">(opcional)</span></label><textarea id="obs" class="textarea" style="min-height:80px" placeholder="Ej. requiero complemento de pago, enviar también a otro correo"></textarea></div>
      <div class="between" style="flex-wrap:wrap"><a class="btn btn-ghost" routerLink="/cuenta/pedidos/BSV-24-01837"><bsv-icon name="arrowLeft" style="--icon:20px" /> Volver al pedido</a><button class="btn btn-primary btn-lg" type="submit">Enviar solicitud</button></div>
    </form>
    } @else {
    <div class="card" data-component="InvoiceStatus"><div class="row"><span class="badge badge-pagado">Enviado a contabilidad</span><span class="small muted">hoy · 11:05</span></div><h3 style="margin-top:12px">Recibimos tu solicitud</h3><p class="muted">Tu CFDI llegará a <strong>contabilidad&#64;tallermendoza.mx</strong> en máximo 2 días hábiles. Te avisamos también desde aquí.</p>
      <bsv-timeline [steps]="[{ title: 'Solicitud enviada', meta: 'Hoy · 11:05', state: 'done' }, { title: 'En revisión por contabilidad', meta: 'Validando RFC y uso de CFDI', state: 'current' }, { title: 'Factura enviada', meta: 'PDF y XML por correo', state: 'pending' }]" />
      <div class="row"><a class="btn btn-secondary" routerLink="/cuenta/pedidos/BSV-24-01837">Volver al pedido</a><a class="btn btn-ghost" routerLink="/cuenta/pedidos">Mis pedidos</a></div></div>
    }
    <section data-component="InvoiceHistory"><h3>Facturas anteriores</h3>
      <table class="table"><thead><tr><th>Pedido</th><th>Estado</th><th>Fecha</th><th class="num">Monto</th><th></th></tr></thead><tbody>
        <tr><td class="mono">BSV-24-01644</td><td><span class="badge badge-entregado">Factura enviada</span></td><td>20 sep 2026</td><td class="num">$9,450.00</td><td><a href="#">PDF</a> · <a href="#">XML</a></td></tr>
        <tr><td class="mono">BSV-24-01398</td><td><span class="badge badge-pagado">Enviado a contabilidad</span></td><td>22 ago 2026</td><td class="num">$18,500.00</td><td class="muted">—</td></tr>
      </tbody></table></section>
  </div></div>`,
})
export class Invoice { sent = signal(false); saved = signal(true); }
