import { RenderMode, ServerRoute } from '@angular/ssr';
/** Desde la bala F1 home, categorías y series listan desde la API de tienda, así que se renderizan en el servidor por
 *  petición (CloudFront cachea con las cabeceras del back-office); solo lo que no depende de la API se prerenderiza.
 *  Lo que depende de sesión o carrito se renderiza en el cliente. */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'legal', renderMode: RenderMode.Prerender },
  // Páginas de texto fijo: prerenderizadas, para que el contenido legal y de contacto exista en el HTML (buscadores, vistas previas).
  { path: 'terminos', renderMode: RenderMode.Prerender },
  { path: 'privacidad', renderMode: RenderMode.Prerender },
  { path: 'contacto', renderMode: RenderMode.Prerender },
  { path: 'categoria/:slug', renderMode: RenderMode.Server },
  { path: 'serie/:serie', renderMode: RenderMode.Server },
  { path: 'producto/:id', renderMode: RenderMode.Server },
  { path: 'buscar', renderMode: RenderMode.Server },
  { path: 'seguimiento', renderMode: RenderMode.Server },
  { path: 'seguimiento/:folio', renderMode: RenderMode.Server },
  { path: 'catalogo', renderMode: RenderMode.Prerender },
  // Sesión o carrito: en el cliente.
  { path: 'carrito', renderMode: RenderMode.Client },
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'checkout', renderMode: RenderMode.Client },
  { path: 'checkout/confirmando', renderMode: RenderMode.Client },
  { path: 'pedido/:folio/gracias', renderMode: RenderMode.Client },
  { path: 'cuenta', renderMode: RenderMode.Client },
  { path: 'cuenta/pedidos', renderMode: RenderMode.Client },
  { path: 'cuenta/pedidos/:id', renderMode: RenderMode.Client },
  { path: 'cuenta/devolucion', renderMode: RenderMode.Client },
  // Lo que no existe se resuelve en el servidor para poder responder 404 (ver features/errors/not-found.ts).
  { path: '**', renderMode: RenderMode.Server },
];
