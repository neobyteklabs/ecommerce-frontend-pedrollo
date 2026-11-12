import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRAND, sellerLine } from '../../core/brand';
import { POLITICA } from '../../core/legal';

/**
 * Aviso de privacidad de la tienda. Sigue la estructura del aviso integral que el grupo ya publica en su landing
 * (barmesamexico.com.mx/privacidad) y describe lo que ESTA tienda recaba de verdad: contacto, entrega, datos fiscales y lo
 * técnico del pedido. El responsable sale de `BRAND.vendedor`.
 */
@Component({
  selector: 'bsv-privacy', imports: [RouterLink],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Privacidad' },
  template: `<div class="account-layout">
    <nav class="account-nav" aria-label="Contenido" data-component="LegalNav">
      <a routerLink="/privacidad" fragment="responsable">Responsable</a><a routerLink="/privacidad" fragment="datos">Qué datos recabamos</a>
      <a routerLink="/privacidad" fragment="fines">Para qué los usamos</a><a routerLink="/privacidad" fragment="terceros">Con quién los compartimos</a>
      <a routerLink="/privacidad" fragment="arco">Tus derechos (ARCO)</a><a routerLink="/privacidad" fragment="cookies">Cookies</a>
      <a routerLink="/terminos">Términos y condiciones</a>
    </nav>
    <article class="stack" style="max-width:760px" data-component="LegalDoc">
      <header class="card"><p class="eyebrow">Protección de datos</p><h1 style="font-size:var(--text-2xl)">Aviso de privacidad</h1>
        <p class="muted">Cómo recabamos, usamos y protegemos tus datos personales, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.</p>
        <p class="muted small">Última actualización: {{ p.actualizado }}</p></header>

      <section class="card" id="responsable"><h2>Responsable de tus datos</h2>
        <p>{{ quien }}, con domicilio en {{ v.domicilio }}, es responsable del uso y la protección de los datos personales que proporcionas en esta tienda.</p></section>

      <section class="card" id="datos"><h2>Qué datos recabamos</h2>
        <ul><li><strong>De identificación y contacto:</strong> nombre, empresa (si la indicas), correo electrónico y teléfono.</li>
          <li><strong>De entrega:</strong> el domicilio al que enviamos tu pedido.</li>
          <li><strong>Fiscales:</strong> razón social, RFC, régimen, código postal fiscal y uso de CFDI, solo si pides factura.</li>
          <li><strong>Del pedido:</strong> lo que compraste o cotizaste, importes y el estado del pago. De tu tarjeta solo conocemos lo que el procesador nos informa (aprobado o rechazado y por qué); el número completo y el código de seguridad los captura {{ v.pasarela }} y nunca llegan a nuestros sistemas.</li></ul>
        <p>No recabamos datos personales sensibles.</p></section>

      <section class="card" id="fines"><h2>Para qué los usamos</h2>
        <h3 style="font-size:var(--text-lg)">Finalidades necesarias</h3>
        <ul><li>Procesar tu pedido o cotización, cobrarlo y entregarlo.</li>
          <li>Avisarte por correo del avance de tu pedido.</li>
          <li>Emitir tu factura y cumplir obligaciones fiscales y legales.</li>
          <li>Atender garantías, devoluciones y aclaraciones.</li></ul>
        <h3 style="font-size:var(--text-lg)">Finalidades secundarias</h3>
        <ul><li>Dar seguimiento comercial a una cotización.</li>
          <li>Informarte de mantenimiento aplicable a los equipos que compraste, de productos o de promociones.</li></ul>
        <p>Si no quieres que usemos tus datos para las finalidades secundarias, escríbenos a <a [href]="'mailto:' + p.correoPrivacidad">{{ p.correoPrivacidad }}</a>. Negarte no afecta tu compra ni tu atención.</p></section>

      <section class="card" id="terceros"><h2>Con quién los compartimos</h2>
        <p>No vendemos ni cedemos tus datos. Para operar la tienda los tratan por nuestra cuenta, obligados a la confidencialidad: el procesador de pagos ({{ v.pasarela }}), la paquetería que entrega tu pedido (nombre, domicilio y teléfono), y nuestros proveedores de cómputo en la nube y de correo electrónico. Fuera de eso, solo los transferimos cuando una ley o una autoridad competente lo exige.</p></section>

      <section class="card" id="arco"><h2>Tus derechos (ARCO) y revocación del consentimiento</h2>
        <p>Puedes <strong>acceder</strong> a tus datos, <strong>rectificarlos</strong> si son inexactos, pedir su <strong>cancelación</strong> u <strong>oponerte</strong> a que se usen para fines específicos, así como revocar tu consentimiento. Envía tu solicitud a <a [href]="'mailto:' + p.correoPrivacidad">{{ p.correoPrivacidad }}</a> con tu nombre completo, el derecho que quieres ejercer, los datos a los que se refiere y una identificación oficial. Respondemos en los plazos que marca la ley.</p>
        <p>Si consideras que tu derecho a la protección de datos fue vulnerado, puedes acudir ante la autoridad federal competente en la materia.</p></section>

      <section class="card" id="cookies"><h2>Cookies y almacenamiento local</h2>
        <p>La tienda usa almacenamiento local y cookies técnicas necesarias para funcionar: recordar tu carrito, tu código postal y tu pedido en curso. El formulario de pago carga componentes de {{ v.pasarela }}, que usa sus propias cookies para prevenir fraude. No usamos cookies de publicidad de terceros.</p></section>

      <section class="card" id="seguridad"><h2>Seguridad y conservación</h2>
        <p>Mantenemos medidas administrativas, técnicas y físicas razonables para proteger tus datos contra daño, pérdida, alteración o acceso no autorizado. Los conservamos el tiempo necesario para las finalidades descritas y los plazos que exige la legislación fiscal y mercantil.</p>
        <h2>Cambios a este aviso</h2>
        <p>Podemos modificar este aviso por cambios en la ley o en la tienda. La versión vigente es la publicada aquí con su fecha de actualización.</p></section>
    </article></div>`,
})
export class Privacy { v = inject(BRAND).vendedor; quien = sellerLine(this.v); p = POLITICA; }
