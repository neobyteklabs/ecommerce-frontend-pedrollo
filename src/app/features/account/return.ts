import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, Alert, Timeline, Qty } from '../../shared/ui';
import { AccountNav } from './account-nav';

@Component({
  selector: 'bsv-return', imports: [RouterLink, Icon, Alert, Timeline, Qty, AccountNav],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Devoluciones' },
  template: `<div class="account-layout"><bsv-account-nav /><div class="stack" style="max-width:720px">
    <div><h1 style="font-size:var(--text-2xl);margin-bottom:4px">Solicitar devolución</h1><span class="muted small">Pedido <span class="mono">BSV-24-01837</span> · entregado hace 3 días · tienes hasta el 31 de octubre</span></div>
    @if (!sent()) {
    <form class="card stack" data-component="ReturnForm" (submit)="$event.preventDefault(); sent.set(true)">
      <fieldset style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:8px">¿Qué artículo deseas devolver?</legend>
        <label class="radio-card"><input type="radio" name="item" checked /><div><strong><span class="model">PKm 60</span> · Bomba periférica 0.5 HP</strong><span>2 piezas · $1,890.00 c/u</span></div></label>
        <label class="radio-card" style="margin-top:8px"><input type="radio" name="item" /><div><strong><span class="model">4SR 2/9</span> · Bomba sumergible 1 HP</strong><span>1 pieza · $9,850.00</span></div></label></fieldset>
      <div class="field"><label>Cantidad a devolver</label><bsv-qty [(value)]="qty" /></div>
      <div class="field"><label for="motivo">Motivo</label><select id="motivo" class="select" required><option value="">Elige un motivo</option><option>Llegó dañado</option><option>No es el modelo que pedí</option><option>No funciona / falla al arrancar</option><option>Ya no lo necesito</option><option>Otro</option></select><span class="hint">Si falla al arrancar, primero revisa voltaje y cebado: <a href="#">guía rápida</a>.</span></div>
      <div class="field"><label>Fotos <span class="muted" style="font-weight:400">(mínimo 1, máximo 5)</span></label>
        <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(96px,1fr))" data-component="PhotoUpload"><button type="button" class="img-slot" data-slot="" style="aspect-ratio:1;min-height:0;flex-direction:column;gap:6px;cursor:pointer;color:var(--color-primary);font-family:var(--font-body)"><bsv-icon name="camera" />Agregar foto</button><div class="img-slot has-img" style="aspect-ratio:1;min-height:0"><span class="xs">IMG_2041.jpg</span></div></div>
        <span class="hint">Incluye la etiqueta de datos de la bomba y el empaque.</span></div>
      <div class="field"><label for="com">Comentarios</label><textarea id="com" class="textarea" placeholder="Cuéntanos qué pasó. Entre más detalle, más rápido resolvemos."></textarea></div>
      <bsv-alert kind="info">Si aprobamos la devolución te mandamos una guía prepagada. El reembolso llega a tu tarjeta en 5–10 días hábiles después de recibir el equipo.</bsv-alert>
      <div class="between" style="flex-wrap:wrap"><a class="btn btn-ghost" routerLink="/cuenta/pedidos/BSV-24-01837"><bsv-icon name="arrowLeft" style="--icon:20px" /> Volver al pedido</a><button class="btn btn-primary btn-lg" type="submit">Enviar solicitud</button></div>
    </form>
    } @else {
    <div class="card" data-component="ReturnStatus"><div class="row"><span class="badge badge-recibido">Solicitada</span><span class="small muted">Devolución <span class="mono">DEV-0412</span></span></div><h3 style="margin-top:12px">Solicitud enviada</h3><p class="muted">La revisamos en máximo 1 día hábil y te avisamos por correo.</p>
      <bsv-timeline [steps]="[{ title: 'Solicitada', meta: 'Hoy · 11:20', state: 'current' }, { title: 'Guía emitida', meta: 'Te mandamos la etiqueta prepagada', state: 'pending' }, { title: 'Recibida en CEDIS', meta: 'Revisión del equipo', state: 'pending' }, { title: 'Reembolsada', meta: '5–10 días hábiles a tu tarjeta', state: 'pending' }]" />
      <a class="btn btn-secondary" routerLink="/cuenta/pedidos/BSV-24-01837">Volver al pedido</a></div>
    }
    <section data-component="ReturnHistory"><h3>Devoluciones anteriores</h3><div class="stack-sm">
      <div class="card card-sm"><div class="between" style="flex-wrap:wrap"><div><span class="mono" style="font-weight:600">DEV-0388</span> · PKm 100 · pedido BSV-24-01512</div><span class="badge badge-entregado">Reembolsada</span></div>
        <bsv-timeline style="display:block;margin-top:12px" [steps]="[{ title: 'Solicitada', meta: '6 sep', state: 'done' }, { title: 'Guía emitida', meta: '7 sep · Estafeta 7845 0011 2298 44', state: 'done' }, { title: 'Recibida', meta: '10 sep · CEDIS Tlalnepantla', state: 'done' }, { title: 'Reembolsada', meta: '12 sep · $2,650.00 a Visa 4242', state: 'done' }]" /></div>
      <div class="card card-sm"><div class="between" style="flex-wrap:wrap"><div><span class="mono" style="font-weight:600">DEV-0301</span> · TOP 2 · pedido BSV-24-01644</div><span class="badge badge-cancelado">Rechazada</span></div>
        <bsv-timeline style="display:block;margin-top:12px" [steps]="[{ title: 'Solicitada', meta: '22 sep', state: 'done' }, { title: 'Guía emitida', meta: '23 sep', state: 'done' }, { title: 'Recibida', meta: '26 sep', state: 'done' }, { title: 'Rechazada', meta: '27 sep', state: 'rejected' }]">
          <bsv-alert rejected kind="danger" title="Motivo" class="t-body">El equipo presenta daño por operación en seco (sello quemado), no cubierto por garantía. Te lo regresamos sin costo y te enviamos cotización de reparación.</bsv-alert></bsv-timeline></div>
    </div></section>
  </div></div>`,
})
export class Return { sent = signal(false); qty = signal(1); }
