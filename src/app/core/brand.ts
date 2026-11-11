import { InjectionToken } from '@angular/core';

/** Marca activa. Este frontend es Pedrollo; el sistema sigue siendo genérico:
 *  cambiar BRAND re-pinta todos los tokens (ver styles/tokens.css [data-brand]). */
/** `logo`: cabecera clara (44 px de alto); `logoCompact`: cabecera en móvil (34 px, sin distintivo);
 *  `logoOnDark`: pie y fondos de tinta (48 px, una tinta blanca). Son los SVG de `public/brand/` entregados el
 *  2026-10-15 (manual: BRANDING-LOGO.pdf del paquete). Nunca deformar, recolorear ni invertir el orden. */
/**
 * Quién vende (11-nov). Es EL lugar donde vive el nombre legal del vendedor: lo leen el pie de página y los términos y condiciones.
 * Hoy factura una persona física con actividad empresarial bajo el nombre comercial; el día que la operación vuelva a la persona moral
 * se cambian `razonSocial` y `figura` aquí (y las llaves de la pasarela en el backend), sin tocar plantillas.
 *  - `razonSocial`: como aparece en la constancia de situación fiscal de quien factura.
 *  - `pasarela`: el nombre que se le muestra al comprador como procesador de pagos.
 */
export interface Seller { nombreComercial: string; siglas: string; razonSocial: string; figura: 'persona-fisica' | 'persona-moral'; rfc: string | null; domicilio: string; pasarela: string; }
export interface Brand { id: 'pedrollo' | 'barmesa' | 'evans'; name: string; tagline: string; logo: string | null; logoCompact: string | null; logoOnDark: string | null; vendedor: Seller; }

/** «operada por X, persona física con actividad empresarial que usa el nombre comercial Y» / «operada por X (Y)». */
export const sellerLine = (v: Seller) => v.figura === 'persona-fisica'
  ? `${v.razonSocial}, persona física con actividad empresarial que opera con el nombre comercial ${v.nombreComercial} (${v.siglas})`
  : `${v.razonSocial} (${v.siglas})`;

export const BRAND = new InjectionToken<Brand>('BRAND', {
  providedIn: 'root',
  factory: () => ({ id: 'pedrollo', name: 'Pedrollo', tagline: 'Distribuidor autorizado en México', logo: 'brand/dual-horizontal.svg', logoCompact: 'brand/dual-horizontal-limpio.svg', logoOnDark: 'brand/dual-horizontal-blanco.svg',
    // PENDIENTE DE CONFIRMAR con la constancia de situación fiscal: nombre exacto, RFC (opcional mostrarlo) y domicilio.
    vendedor: { nombreComercial: 'Bombas y Sistemas Vega', siglas: 'BSV', razonSocial: 'Manuel Dioney Vega Cruz', figura: 'persona-fisica', rfc: null, domicilio: 'Tlalnepantla de Baz, Estado de México', pasarela: 'Mercado Pago' } }),
});
