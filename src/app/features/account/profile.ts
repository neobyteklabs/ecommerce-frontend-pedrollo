import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/toast';
import { SessionService } from '../../core/session';
import { Icon } from '../../shared/ui';
import { AccountNav } from './account-nav';

@Component({
  selector: 'bsv-profile', imports: [RouterLink, Icon, AccountNav],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Cuenta' },
  template: `<div class="account-layout"><bsv-account-nav /><div class="stack">
    <div class="between" style="flex-wrap:wrap"><div><h1 style="font-size:var(--text-2xl);margin-bottom:4px">Hola, {{ s.user()?.name || 'Laura' }}</h1><span class="muted small">{{ s.user()?.email || 'laura.mendoza@gmail.com' }} · sesión con Google</span></div><a class="btn btn-secondary" routerLink="/cuenta/pedidos">Ver mis pedidos</a></div>
    <section class="card" data-component="Addresses">
      <div class="section-title" style="margin-bottom:16px"><h3 style="margin:0">Direcciones de envío</h3><button class="btn btn-ghost btn-sm" type="button"><bsv-icon name="plus" style="--icon:18px" /> Agregar</button></div>
      <div class="grid md-grid-2">
        <div class="address-card"><bsv-icon name="mapPin" class="muted" /><div style="flex:1"><div class="between"><strong>Taller</strong><span class="badge badge-primary no-dot">Predeterminada</span></div><span>Ing. Laura Mendoza · Av. Mario Colín 125, Col. Industrial La Loma, 54060 Tlalnepantla, Méx.</span><div class="row" style="margin-top:8px"><a href="#" class="small">Editar</a><a href="#" class="small">Eliminar</a></div></div></div>
        <div class="address-card"><bsv-icon name="mapPin" class="muted" /><div style="flex:1"><strong>Oficina</strong><span>Laura Mendoza · Calle Lago Zurich 219, Col. Ampliación Granada, 11529 Miguel Hidalgo, CDMX</span><div class="row" style="margin-top:8px"><a href="#" class="small">Editar</a><a href="#" class="small">Eliminar</a><a href="#" class="small">Hacer predeterminada</a></div></div></div>
      </div></section>
    <section class="card" id="fiscal" data-component="TaxData">
      <h3>Datos fiscales <span class="badge badge-neutral no-dot" style="vertical-align:middle">Opcional</span></h3>
      <p class="muted small">Guárdalos una vez y solicita facturas con un clic. Solo los usamos para emitir tu CFDI.</p>
      <div class="grid md-grid-2">
        <div class="field"><label for="rfc">RFC</label><input id="rfc" class="input mono" value="MEHL850612QA3" style="text-transform:uppercase" /><span class="hint">12 caracteres persona moral, 13 persona física</span></div>
        <div class="field"><label for="rs">Razón social</label><input id="rs" class="input" value="LAURA MENDOZA HERNÁNDEZ" /><span class="hint">Exactamente como aparece en tu constancia fiscal</span></div>
        <div class="field"><label for="cpf">Código postal fiscal</label><input id="cpf" class="input" inputmode="numeric" value="54060" /></div>
        <div class="field"><label for="reg">Régimen fiscal</label><select id="reg" class="select"><option>612 · Personas físicas con actividades empresariales</option><option>601 · General de ley personas morales</option><option>626 · Régimen simplificado de confianza</option></select></div>
        <div class="field"><label for="uso">Uso de CFDI</label><select id="uso" class="select"><option>G03 · Gastos en general</option><option>G01 · Adquisición de mercancías</option><option>S01 · Sin efectos fiscales</option></select></div>
        <div class="field"><label for="mf">Correo para facturas</label><input id="mf" class="input" type="email" value="contabilidad@tallermendoza.mx" /></div>
      </div>
      <div class="row" style="margin-top:16px"><button class="btn btn-primary" type="button" (click)="toast.show('Datos fiscales guardados')">Guardar datos fiscales</button></div>
    </section></div></div>`,
})
export class Profile { toast = inject(ToastService); s = inject(SessionService); }
