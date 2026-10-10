import { RenderMode, ServerRoute } from '@angular/ssr';
/** Catálogo y legales se prerenderizan (SEO); lo que depende de sesión o carrito se renderiza en el cliente. */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'legal', renderMode: RenderMode.Prerender },
  { path: 'categoria/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: async () => (await import('./core/catalog')).FAMILIES.map(f => ({ slug: f.slug })) },
  { path: 'serie/:serie', renderMode: RenderMode.Prerender, getPrerenderParams: async () => (await import('./core/resources')).seriesList().map(s => ({ serie: s.slug })) },
  { path: 'producto/:id', renderMode: RenderMode.Server },
  { path: 'buscar', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Client },
];
