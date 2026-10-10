import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRAND } from '../../core/brand';
@Component({
  selector: 'bsv-footer', imports: [RouterLink],
  template: `<footer class="site-footer" data-component="Footer"><div class="container">
    <div class="cols">
      <div><div class="wordmark" style="--brand-name:'{{ brand.name }}'"></div><p style="margin-top:8px;max-width:36ch">Distribuidor autorizado {{ brand.name }} en México. Operado por Bombas y Sistemas Vega, S.A. de C.V.</p><p>Tlalnepantla de Baz, Estado de México<br /><a href="tel:+525572589681">55 7258 9681</a> · <a href="mailto:ventas@bombasvega.mx">ventas&#64;bombasvega.mx</a></p></div>
      <div><h4>Tienda</h4><a routerLink="/categoria/perifericas">Periféricas</a><br /><a routerLink="/categoria/centrifugas">Centrífugas</a><br /><a routerLink="/categoria/multietapas">Multietapas</a><br /><a routerLink="/categoria/pozo-profundo">Pozo profundo</a><br /><a routerLink="/categoria/presurizacion">Presurización</a></div>
      <div><h4>Tu cuenta</h4><a routerLink="/cuenta/pedidos">Mis pedidos</a><br /><a routerLink="/cuenta/factura">Solicitar factura</a><br /><a routerLink="/cuenta/devolucion">Devoluciones</a><br /><a routerLink="/cuenta">Direcciones y datos fiscales</a></div>
      <div><h4>Ayuda</h4><a routerLink="/legal" fragment="envios">Envíos y devoluciones</a><br /><a routerLink="/legal" fragment="contacto">Contacto</a><br /><a routerLink="/legal" fragment="terminos">Términos y condiciones</a><br /><a routerLink="/legal" fragment="privacidad">Aviso de privacidad</a></div>
    </div>
    <div class="legal"><span>© 2026 Bombas y Sistemas Vega, S.A. de C.V.</span><span>Pagos seguros con Stripe · Precios en MXN con IVA incluido</span></div>
  </div></footer>`,
})
export class Footer { brand = inject(BRAND); }
