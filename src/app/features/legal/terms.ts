import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRAND, sellerLine } from '../../core/brand';
import { POLITICA } from '../../core/legal';

/**
 * Términos y condiciones de la tienda, con la política de envíos, devoluciones y cancelaciones dentro (bala 8).
 *
 * El texto parte de los términos que el grupo ya publica en su landing (barmesamexico.com.mx/terminos) y les agrega lo que
 * una tienda con pago en línea necesita. Quién vende sale de `BRAND.vendedor` y los plazos de `POLITICA`: ni un nombre ni un
 * número están escritos aquí a mano.
 */
@Component({
  selector: 'bsv-terms', imports: [RouterLink],
  host: { class: 'container section block', style: 'padding-top:16px', 'data-page': 'Terminos' },
  template: `<div class="account-layout">
    <nav class="account-nav" aria-label="Contenido" data-component="LegalNav">
      <a routerLink="/terminos" fragment="quien-vende">Quién vende</a><a routerLink="/terminos" fragment="precios">Precios y disponibilidad</a>
      <a routerLink="/terminos" fragment="pago">Pedido y pago</a><a routerLink="/terminos" fragment="cotizaciones">Cotizaciones</a>
      <a routerLink="/terminos" fragment="envios">Envíos y entrega</a><a routerLink="/terminos" fragment="devoluciones">Devoluciones y cancelaciones</a>
      <a routerLink="/terminos" fragment="garantia">Garantía</a><a routerLink="/terminos" fragment="factura">Facturación</a>
      <a routerLink="/privacidad">Aviso de privacidad</a>
    </nav>
    <article class="stack" style="max-width:760px" data-component="LegalDoc">
      <header class="card"><p class="eyebrow">Marco legal</p><h1 style="font-size:var(--text-2xl)">Términos y condiciones</h1>
        <p class="muted">Condiciones que rigen el uso de esta tienda en línea, las compras y cotizaciones que se hacen en ella, y la política de envíos, devoluciones y cancelaciones.</p>
        <p class="muted small">Última actualización: {{ p.actualizado }}</p></header>

      <section class="card" id="quien-vende"><h2>1. Quién vende</h2>
        <p>Esta tienda es operada por {{ quien }}, distribuidor autorizado de {{ brand.name }} en México, con domicilio en {{ v.domicilio }}.@if (v.rfc) { RFC {{ v.rfc }}. } Es quien te vende, quien recibe tu pago y quien emite tu factura.</p>
        <p>Al usar la tienda, comprar o pedir una cotización aceptas estos términos. Si no estás de acuerdo con ellos, por favor no la utilices.</p></section>

      <section class="card" id="precios"><h2>2. Productos, precios y disponibilidad</h2>
        <p>Los precios están en pesos mexicanos e incluyen IVA. Pueden cambiar sin previo aviso; el precio que vale es el que ves al momento de pagar, y es el que queda en tu pedido.</p>
        <p>La disponibilidad que muestra cada producto es la del momento en que lo consultas. Un producto «en existencia» se puede comprar en línea; uno «sobre pedido» se cotiza con un asesor, que te confirma el tiempo de entrega.</p>
        <p><strong>Equipos de venta por cotización.</strong> Algunos equipos, por su precio o por la configuración que requieren, no se compran directamente en el carrito aunque haya existencia: se muestran con su precio y se venden por cotización, para que un asesor confirme contigo que el modelo, el voltaje y la configuración son los que tu instalación necesita.</p>
        <p>Las fotografías, fichas técnicas y curvas son las del fabricante y sirven de referencia; las especificaciones que obligan son las de la ficha técnica vigente del modelo.</p></section>

      <section class="card" id="pago"><h2>3. Pedido y pago</h2>
        <p>Puedes comprar sin crear una cuenta. Al iniciar el pago apartamos tu mercancía durante {{ p.reservaMinutos }} minutos; si el pago no se completa en ese tiempo, el pedido expira, la mercancía se libera y <strong>no se te cobra nada</strong>.</p>
        <p>Aceptamos tarjetas de crédito y débito. El cobro lo procesa {{ v.pasarela }}; nosotros no vemos ni guardamos los datos completos de tu tarjeta. Si tu banco rechaza el cargo, el pedido sigue abierto para que intentes con otra tarjeta mientras dure la reserva.</p>
        <p>Cuando el pago se aprueba recibes un correo con tu número de pedido. Con ese número y tu correo o teléfono puedes ver el avance en <a routerLink="/seguimiento">Seguimiento</a> en cualquier momento.</p></section>

      <section class="card" id="cotizaciones"><h2>4. Cotizaciones</h2>
        <p>Las cotizaciones que solicitas desde la tienda las atiende un asesor. Cada cotización:</p>
        <ul><li>tiene la vigencia que indica el propio documento; vencida, precios y condiciones se confirman de nuevo;</li>
          <li>está sujeta a la disponibilidad del fabricante;</li>
          <li>si incluye precios en moneda extranjera, se convierte al tipo de cambio y en las condiciones que el documento señala;</li>
          <li>nos obliga una vez que la aceptas y se confirma el pedido en las condiciones pactadas.</li></ul></section>

      <section class="card" id="envios"><h2>5. Envíos y entrega</h2>
        <p>Enviamos a la República Mexicana. El costo y el tiempo estimado de entrega dependen de tu código postal y se muestran <strong>antes de pagar</strong>; si para tu zona no tenemos una tarifa definida, la tienda no te cobra un envío a ciegas: te ofrece cotizarlo.</p>
        <p>Según tu zona, la entrega la hace una paquetería (recibes el número de guía por correo) o un repartidor nuestro. Los tiempos son estimados y cuentan a partir de la confirmación del pago.</p>
        <p><strong>Al recibir, revisa el paquete.</strong> Si llega dañado, abierto o incompleto, anótalo con quien te lo entrega y repórtalo dentro de las {{ d.reporteDanoHoras }} horas siguientes, con fotografías, para que lo resolvamos sin costo para ti.</p></section>

      <section class="card" id="devoluciones" data-component="ReturnPolicy"><h2>6. Devoluciones y cancelaciones</h2>
        <h3 style="font-size:var(--text-lg)">Cancelar un pedido</h3>
        <p>Puedes cancelar un pedido pagado mientras no haya salido a entrega y te reembolsamos el total. Si ya salió, aplica lo que sigue.</p>
        <h3 style="font-size:var(--text-lg)">Devolver un producto</h3>
        <p>Tienes <strong>{{ d.plazoDias }} días naturales</strong> desde que lo recibes para solicitar la devolución, con estas condiciones:</p>
        <ul><li>el equipo está <strong>sin instalar y sin uso</strong>;</li>
          <li>conserva su empaque original, accesorios, manuales y póliza de garantía;</li>
          <li>presentas tu número de pedido.</li></ul>
        <p><strong>No se aceptan en devolución</strong> los equipos que ya fueron instalados o puestos en operación, ni los que se surtieron sobre pedido especial o con una configuración hecha a tu medida mediante cotización, salvo que tengan un defecto de fábrica (en ese caso aplica la garantía).</p>
        <h3 style="font-size:var(--text-lg)">Cómo solicitarla</h3>
        <p>Escríbenos a <a [href]="'mailto:' + p.correoVentas">{{ p.correoVentas }}</a> o por <a [href]="p.whatsapp" rel="noopener" target="_blank">WhatsApp</a> con tu número de pedido, el motivo y fotografías del equipo y su empaque. Te respondemos con las instrucciones y la dirección de entrega.</p>
        <h3 style="font-size:var(--text-lg)">Quién paga el envío de regreso</h3>
        <p>Si el producto llegó defectuoso, dañado o no es el que pediste, el envío de regreso corre por nuestra cuenta. Si la devolución es por otro motivo (por ejemplo, ya no lo necesitas o elegiste un modelo que no era), el envío de regreso lo cubres tú.</p>
        <h3 style="font-size:var(--text-lg)">Reembolso</h3>
        <p>Recibido el equipo, lo revisamos y, si cumple las condiciones, te reembolsamos al mismo medio con el que pagaste dentro de los {{ d.reembolsoDiasHabiles }} días hábiles siguientes. El tiempo en que tu banco lo refleja depende de él. Si prefieres cambiarlo por otro modelo, un asesor te ayuda y solo se ajusta la diferencia.</p>
        <p class="muted small">Lo anterior no limita los derechos que la Ley Federal de Protección al Consumidor te reconoce en compras a distancia.</p></section>

      <section class="card" id="garantia"><h2>7. Garantía</h2>
        <p>Los equipos tienen la garantía del fabricante, en los términos y plazos que este establece para cada modelo. Te apoyamos a tramitarla; eso no amplía su alcance ni su vigencia.</p>
        <p>La garantía no cubre daños por instalación incorrecta, operación fuera de las condiciones de diseño (por ejemplo, trabajo en seco o voltaje distinto al de placa), falta de mantenimiento o intervención de personal no autorizado.</p></section>

      <section class="card" id="factura"><h2>8. Facturación</h2>
        <p>Puedes solicitar tu factura desde <a routerLink="/seguimiento">Seguimiento</a> con tu número de pedido. Se emite conforme a la legislación fiscal mexicana con los datos que proporcionas; su exactitud es tu responsabilidad. La factura la emite {{ v.razonSocial }}.</p></section>

      <section class="card" id="otros"><h2>9. Propiedad intelectual</h2>
        <p>Las marcas, logotipos, textos, fichas técnicas, imágenes y diseños de la tienda pertenecen a {{ v.nombreComercial }} o a sus legítimos titulares. No está permitido reproducirlos o usarlos sin autorización.</p>
        <h2>10. Disponibilidad del sitio y responsabilidad</h2>
        <p>Procuramos que la tienda esté siempre disponible, sin garantizar que esté libre de interrupciones o errores. En la medida que la ley lo permite, no respondemos por daños derivados del uso de la tienda o de no poder usarla, ni por el contenido de sitios de terceros enlazados.</p>
        <h2>11. Datos personales</h2>
        <p>El tratamiento de tus datos se rige por nuestro <a routerLink="/privacidad">Aviso de privacidad</a>.</p>
        <h2>12. Cambios a estos términos</h2>
        <p>Podemos actualizar estos términos; la versión vigente es la publicada aquí con su fecha. A un pedido le aplican los términos vigentes el día en que se pagó.</p>
        <h2>13. Ley aplicable y jurisdicción</h2>
        <p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia puedes acudir a la Procuraduría Federal del Consumidor; para lo que no le competa, las partes se someten a los tribunales de {{ p.jurisdiccion }}.</p></section>

      <p class="muted small">¿Dudas sobre estos términos? Escríbenos a <a [href]="'mailto:' + p.correoVentas">{{ p.correoVentas }}</a> o llámanos al <a [href]="'tel:' + p.telefono.tel">{{ p.telefono.texto }}</a>.</p>
    </article></div>`,
})
export class Terms { brand = inject(BRAND); v = this.brand.vendedor; quien = sellerLine(this.v); p = POLITICA; d = POLITICA.devolucion; }
