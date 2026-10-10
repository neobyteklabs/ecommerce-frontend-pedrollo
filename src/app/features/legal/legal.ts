import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/toast';
import { Icon } from '../../shared/ui';

@Component({
  selector: 'bsv-legal', imports: [RouterLink, Icon],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Legales' },
  template: `<div class="account-layout">
    <nav class="account-nav" aria-label="Legales" data-component="LegalNav"><a routerLink="/legal" fragment="terminos">Términos y condiciones</a><a routerLink="/legal" fragment="privacidad">Aviso de privacidad</a><a routerLink="/legal" fragment="envios">Envíos y devoluciones</a><a routerLink="/legal" fragment="contacto">Contacto</a></nav>
    <div class="stack" style="max-width:760px">
      <section class="card" id="terminos" data-component="LegalSection"><h1 style="font-size:var(--text-2xl)">Términos y condiciones</h1><p class="muted small">Última actualización: 1 de octubre de 2026</p>
        <h4>1. Quién vende</h4><p>Esta tienda es operada por Bombas y Sistemas Vega, S.A. de C.V. (BSV), distribuidor autorizado de la marca en México, con domicilio en Tlalnepantla de Baz, Estado de México.</p>
        <h4>2. Precios y disponibilidad</h4><p>Los precios se muestran en pesos mexicanos con IVA incluido. Pueden cambiar sin previo aviso; el precio válido es el que ves al momento de pagar. Los artículos "sobre pedido" se surten en 5 a 7 días hábiles.</p>
        <h4>3. Pago</h4><p>Aceptamos tarjetas de crédito y débito procesadas por Stripe. BSV no almacena datos completos de tarjetas.</p>
        <h4>4. Garantía</h4><p>Los equipos cuentan con garantía de fábrica de 12 meses contra defectos de fabricación. No cubre daños por operación en seco, voltaje incorrecto o instalación inadecuada.</p></section>
      <section class="card" id="privacidad" data-component="LegalSection"><h2>Aviso de privacidad</h2><p>BSV es responsable del tratamiento de tus datos personales. Los usamos para procesar pedidos, emitir facturas, enviar notificaciones del pedido y atender garantías. No los vendemos ni los compartimos con fines publicitarios. Puedes ejercer tus derechos ARCO escribiendo a <a href="mailto:privacidad@bombasvega.mx">privacidad&#64;bombasvega.mx</a>.</p></section>
      <section class="card" id="envios" data-component="LegalSection"><h2>Envíos y devoluciones</h2><h4>Envíos</h4><p>Enviamos a toda la República por paquetería asegurada (Estafeta, DHL). Existencia local sale en 24–48 h. Envío gratis en pedidos mayores a $5,000 en la zona metropolitana. Puedes recoger sin costo en CEDIS Tlalnepantla, Puebla, Guadalajara y Mérida.</p><h4>Devoluciones</h4><p>Tienes 30 días naturales desde la entrega para solicitar una devolución desde tu cuenta. El equipo debe estar completo y sin uso, salvo falla de fábrica. Te enviamos guía prepagada y reembolsamos a tu método de pago en 5–10 días hábiles tras recibirlo.</p></section>
      <section class="card" id="contacto" data-component="ContactSection"><h2>Contacto</h2>
        <div class="grid md-grid-2">
          <div class="trust-item"><bsv-icon name="phone" style="--icon:28px" /><div><strong>Ventas y soporte</strong><span><a href="tel:+525572589681">55 7258 9681</a> · <a href="tel:+525570986532">55 7098 6532</a><br />Lun–Vie 9:00–18:00, Sáb 9:00–13:00</span></div></div>
          <div class="trust-item"><bsv-icon name="mail" style="--icon:28px" /><div><strong>Correo</strong><span><a href="mailto:ventas@bombasvega.mx">ventas&#64;bombasvega.mx</a><br />Respondemos en menos de 1 día hábil</span></div></div>
          <div class="trust-item"><bsv-icon name="mapPin" style="--icon:28px" /><div><strong>CEDIS Tlalnepantla</strong><span>Tlalnepantla de Baz, Estado de México<br />Puebla · Zapopan · Mérida</span></div></div>
          <div class="trust-item"><bsv-icon name="zap" style="--icon:28px" /><div><strong>WhatsApp</strong><span><a href="https://wa.me/525572589681">Escríbenos</a> con tu modelo o número de pedido</span></div></div>
        </div>
        <form class="stack" style="margin-top:24px" (submit)="$event.preventDefault(); toast.show('Mensaje enviado. Te respondemos en menos de 1 día hábil.')" data-component="ContactForm">
          <div class="grid md-grid-2"><div class="field"><label for="cn">Nombre</label><input id="cn" class="input" required /></div><div class="field"><label for="cm">Correo o teléfono</label><input id="cm" class="input" required /></div></div>
          <div class="field"><label for="ct">Mensaje</label><textarea id="ct" class="textarea" required placeholder="¿Qué equipo buscas o con qué pedido necesitas ayuda?"></textarea></div>
          <div><button class="btn btn-primary" type="submit">Enviar mensaje</button></div>
        </form></section>
    </div></div>`,
})
export class Legal { toast = inject(ToastService); }
