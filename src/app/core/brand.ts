import { InjectionToken } from '@angular/core';

/** Marca activa. Este frontend es Pedrollo; el sistema sigue siendo genérico:
 *  cambiar BRAND re-pinta todos los tokens (ver styles/tokens.css [data-brand]). */
/** `logo`: cabecera clara (44 px de alto); `logoCompact`: cabecera en móvil (34 px, sin distintivo);
 *  `logoOnDark`: pie y fondos de tinta (48 px, una tinta blanca). Son los SVG de `public/brand/` entregados el
 *  2026-10-15 (manual: BRANDING-LOGO.pdf del paquete). Nunca deformar, recolorear ni invertir el orden. */
export interface Brand { id: 'pedrollo' | 'barmesa' | 'evans'; name: string; tagline: string; logo: string | null; logoCompact: string | null; logoOnDark: string | null; }

export const BRAND = new InjectionToken<Brand>('BRAND', {
  providedIn: 'root',
  factory: () => ({ id: 'pedrollo', name: 'Pedrollo', tagline: 'Distribuidor autorizado en México', logo: 'brand/dual-horizontal.svg', logoCompact: 'brand/dual-horizontal-limpio.svg', logoOnDark: 'brand/dual-horizontal-blanco.svg' }),
});
