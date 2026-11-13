import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRAND, sellerLine } from '../../core/brand';
import { MATRIZ, POLITICA } from '../../core/legal';
import { Icon } from '../../shared/ui';

@Component({
  selector: 'bsv-legal', imports: [RouterLink, Icon],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Contacto' },
  template: `<div class="account-layout">
    <nav class="account-nav" aria-label="Ayuda" data-component="LegalNav"><a routerLink="/contacto">Contacto</a><a routerLink="/terminos" fragment="envios">Envíos y entrega</a><a routerLink="/terminos" fragment="devoluciones">Devoluciones</a><a routerLink="/terminos">Términos y condiciones</a><a routerLink="/privacidad">Aviso de privacidad</a></nav>
    <div class="stack" style="max-width:760px">
      <section class="card" id="contacto" data-component="ContactSection"><h1 style="font-size:var(--text-2xl)">Contacto</h1>
        <div class="grid md-grid-2">
          <div class="trust-item"><bsv-icon name="phone" style="--icon:28px" /><div><strong>Ventas y soporte</strong><span><a [href]="'tel:' + p.telefono.tel">{{ p.telefono.texto }}</a> · <a href="tel:+525570986532">55 7098 6532</a><br />Lun–Vie 9:00–18:00, Sáb 9:00–13:00</span></div></div>
          <div class="trust-item"><bsv-icon name="mail" style="--icon:28px" /><div><strong>Correo</strong><span><a [href]="'mailto:' + p.correoVentas">{{ p.correoVentas }}</a><br />Respondemos en menos de 1 día hábil</span></div></div>
          <div class="trust-item"><bsv-icon name="mapPin" style="--icon:28px" /><div><strong>{{ matriz.nombre }}</strong><span>{{ matriz.direccion }}<br /><a [href]="matriz.comoLlegar" target="_blank" rel="noopener">Cómo llegar</a></span></div></div>
          <div class="trust-item"><bsv-icon name="zap" style="--icon:28px" /><div><strong>WhatsApp</strong><span><a [href]="p.whatsapp" target="_blank" rel="noopener">Escríbenos</a> con tu modelo o número de pedido</span></div></div>
        </div>
        <p class="muted small" style="margin-top:16px">¿Buscas un equipo? En la ficha de cada producto está el botón «Cotizar», que le llega directo a un asesor con el modelo que te interesa.</p></section>
    </div></div>`,
})
export class Legal { matriz = MATRIZ; p = POLITICA; v = inject(BRAND).vendedor; quien = sellerLine(this.v); }
