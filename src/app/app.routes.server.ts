import { RenderMode, ServerRoute } from '@angular/ssr';
/** Desde la bala F1 home, categorías y series listan desde la API de tienda, así que se renderizan en el servidor por
 *  petición (CloudFront cachea con las cabeceras del back-office); solo lo que no depende de la API se prerenderiza.
 *  Lo que depende de sesión o carrito se renderiza en el cliente. */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'legal', renderMode: RenderMode.Prerender },
  { path: 'categoria/:slug', renderMode: RenderMode.Server },
  { path: 'serie/:serie', renderMode: RenderMode.Server },
  { path: 'producto/:id', renderMode: RenderMode.Server },
  { path: 'buscar', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Client },
];
