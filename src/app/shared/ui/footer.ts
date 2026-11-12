import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { BRAND } from '../../core/brand';
import { MATRIZ, POLITICA, REDES } from '../../core/legal';

/** Trazos de los logotipos de las redes (24×24, una tinta). Son marcas de sus dueños; aquí solo enlazan a los perfiles del grupo. */
const GLIFOS: Record<string, string> = {
  facebook: 'M14 8.5V7c0-.7.2-1 1.1-1H17V3h-2.6C11.6 3 10.5 4.6 10.5 6.8v1.7H8.5v3h2V21h3.5v-9.5h2.6l.4-3z',
  instagram: 'M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6zm0 6.2a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8zm4.9-6.4a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0zM16.2 3H7.8A4.8 4.8 0 0 0 3 7.8v8.4A4.8 4.8 0 0 0 7.8 21h8.4a4.8 4.8 0 0 0 4.8-4.8V7.8A4.8 4.8 0 0 0 16.2 3zm3.3 13.2a3.300 3.300 0 0 1-3.300 3.300H7.8a3.300 3.300 0 0 1-3.300-3.300V7.8a3.300 3.300 0 0 1 3.300-3.300h8.4a3.300 3.300 0 0 1 3.300 3.300z',
  linkedin: 'M6.500 8.800H3.400V21h3.100zM5 3.200a1.800 1.800 0 1 0 0 3.600 1.800 1.800 0 0 0 0-3.600zM21 14.100c0-3.300-1.800-5.500-4.600-5.500a4 4 0 0 0-3.400 1.800V8.800H9.900V21H13v-6.500c0-1.700.900-2.800 2.300-2.800s2.200 1 2.200 2.800V21H21z',
  youtube: 'M21.600 7.200a2.500 2.500 0 0 0-1.800-1.800C18.200 5 12 5 12 5s-6.200 0-7.800.4A2.500 2.500 0 0 0 2.400 7.200 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.800 2.500 2.500 0 0 0 1.800 1.800C5.800 19 12 19 12 19s6.200 0 7.800-.4a2.500 2.500 0 0 0 1.800-1.800A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.800zM10 15V9l5.200 3z',
};

@Component({
  selector: 'bsv-footer', imports: [RouterLink],
  template: `
  <section class="site-map" aria-labelledby="mapa-titulo" data-component="StoreMap"><div class="container site-map-grid">
    <div><p class="eyebrow">Visítanos</p><h2 id="mapa-titulo">{{ matriz.nombre }}</h2><p>{{ matriz.direccion }}</p>
      <p><a [href]="'tel:' + p.telefono.tel">{{ p.telefono.texto }}</a> · <a [href]="'mailto:' + p.correoVentas">{{ p.correoVentas }}</a></p>
      <a class="btn btn-secondary" [href]="matriz.comoLlegar" target="_blank" rel="noopener">Cómo llegar</a></div>
    <iframe [src]="mapa" title="Mapa de la matriz en Tlalnepantla" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
  </div></section>
  <footer class="site-footer" data-component="Footer"><div class="container">
    <div class="cols">
      <div>@if (brand.logoOnDark) { <div class="brand-logo" data-slot="logo-footer"><img [src]="brand.logoOnDark" [alt]="brand.name + ' · ' + brand.vendedor.nombreComercial" width="475" height="86" /></div> } @else { <div class="wordmark" style="--brand-name:'{{ brand.name }}'"></div> }<p style="margin-top:8px;max-width:36ch">Distribuidor autorizado {{ brand.name }} en México. Operado por {{ brand.vendedor.nombreComercial }}.</p><p>{{ p.jurisdiccion }}<br /><a [href]="'tel:' + p.telefono.tel">{{ p.telefono.texto }}</a> · <a [href]="'mailto:' + p.correoVentas">{{ p.correoVentas }}</a></p>
        <div class="social" data-component="SocialLinks">@for (r of redes; track r.id) { <a [href]="r.url" target="_blank" rel="noopener" [attr.aria-label]="r.nombre + ' de ' + brand.vendedor.nombreComercial" [title]="r.nombre"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path [attr.d]="glifos[r.id]" fill="currentColor" /></svg></a> }</div></div>
      <div><h4>Tienda</h4><a routerLink="/categoria/perifericas">Periféricas</a><br /><a routerLink="/categoria/centrifugas">Centrífugas</a><br /><a routerLink="/categoria/multietapas">Multietapas</a><br /><a routerLink="/categoria/pozo-profundo">Pozo profundo</a><br /><a routerLink="/categoria/presurizacion">Presurización</a></div>
      <div><h4>Tu compra</h4><a routerLink="/seguimiento">Rastrea tu pedido o cotización</a><br /><a routerLink="/seguimiento">Solicitar factura</a><br /><a routerLink="/terminos" fragment="envios">Envíos y entrega</a><br /><a routerLink="/terminos" fragment="devoluciones">Devoluciones y cancelaciones</a></div>
      <div><h4>Ayuda</h4><a routerLink="/contacto">Contacto</a><br /><a routerLink="/terminos">Términos y condiciones</a><br /><a routerLink="/privacidad">Aviso de privacidad</a></div>
    </div>
    <div class="legal"><span>© 2026 {{ brand.vendedor.nombreComercial }} · {{ brand.vendedor.razonSocial }}</span><span>Pagos seguros con {{ brand.vendedor.pasarela }} · Precios en MXN con IVA incluido</span></div>
  </div></footer>`,
})
export class Footer {
  brand = inject(BRAND); matriz = MATRIZ; redes = REDES; p = POLITICA; glifos = GLIFOS;
  /** La URL del mapa es una constante del código (no viene de fuera), por eso se marca como recurso de confianza. */
  mapa = inject(DomSanitizer).bypassSecurityTrustResourceUrl(MATRIZ.mapaEmbed);
}
