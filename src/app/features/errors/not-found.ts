import { Component, RESPONSE_INIT, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/ui';

/**
 * «No encontrado». Es la ruta comodín y también va incrustado donde un identificador no existe (producto, serie, categoría).
 * En el servidor marca la respuesta como 404: sin eso un buscador indexa la página de error como si fuera contenido (o, antes,
 * seguía una redirección al inicio).
 */
@Component({
  selector: 'bsv-not-found', imports: [RouterLink, Icon],
  host: { class: 'container section block', style: 'padding-top:32px;display:block', 'data-page': 'NoEncontrado' },
  template: `
  <h1 style="font-size:var(--text-2xl)">{{ titulo() }}</h1>
  <p class="muted" style="max-width:60ch">{{ detalle() }}</p>
  <div class="row" style="gap:12px;flex-wrap:wrap;margin-top:16px">
    <a class="btn btn-primary" routerLink="/catalogo">Ver el catálogo</a>
    <a class="btn btn-secondary" routerLink="/buscar"><bsv-icon name="search" style="--icon:18px" /> Buscar un modelo</a>
    <a class="btn btn-ghost" routerLink="/">Ir al inicio</a>
  </div>`,
})
export class NotFound {
  titulo = input('No encontramos esa página');
  detalle = input('La dirección no existe o cambió. Puedes buscar el modelo que necesitas o recorrer el catálogo.');
  constructor() { const init = inject(RESPONSE_INIT, { optional: true }); if (init) init.status = 404; }
}
