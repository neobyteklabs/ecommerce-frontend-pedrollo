import { InjectionToken } from '@angular/core';

/** Marca activa. Este frontend es Pedrollo; el sistema sigue siendo genérico:
 *  cambiar BRAND re-pinta todos los tokens (ver styles/tokens.css [data-brand]). */
export interface Brand { id: 'pedrollo' | 'barmesa' | 'evans'; name: string; tagline: string; logo: string | null; }

export const BRAND = new InjectionToken<Brand>('BRAND', {
  providedIn: 'root',
  factory: () => ({ id: 'pedrollo', name: 'Pedrollo', tagline: 'Distribuidor autorizado en México', logo: null }),
});
