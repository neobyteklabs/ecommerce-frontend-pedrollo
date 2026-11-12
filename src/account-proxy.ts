/**
 * La sesión del comprador en el servidor de la tienda (bala 9).
 *
 * El back-office entrega una sesión firmada y opaca; aquí vive en una cookie `HttpOnly` que el JavaScript de la página no puede
 * leer, y este servidor la reenvía al back-office en `X-Buyer-Session`. El navegador nunca ve la sesión ni llama al back-office.
 *
 *   POST /__cuenta/entrar   { credential }  → valida con el back-office, pone la cookie, responde { comprador }
 *   GET  /__cuenta/yo                       → { comprador } y renueva la cookie; { comprador: null } si no hay cookie; 401 si la sesión ya no vale
 *   GET  /__cuenta/pedidos                  → mis pedidos
 *   POST /__cuenta/salir                    → borra la cookie
 *
 * Los POST exigen la cabecera `X-Tienda: 1`: un formulario de otro sitio no puede ponerla sin un preflight de CORS que este
 * servidor no concede, así que nadie puede iniciarle sesión a un visitante con una cuenta ajena desde fuera.
 */

export const SESSION_COOKIE = 'bsv_sesion';
/** 30 días, igual que la vigencia que da el back-office. */
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
/** La forma de una sesión del back-office: `v1.<base64url>.<base64url>`. Lo que no la tenga ni se manda. */
const SESSION_SHAPE = /^v1\.[A-Za-z0-9_-]{4,200}\.[A-Za-z0-9_-]{20,100}$/;

export const looksLikeSession = (v: string | null | undefined): v is string => !!v && SESSION_SHAPE.test(v);

/** La sesión que trae la cabecera `Cookie`, o null si no hay o no tiene forma de sesión. */
export function readSessionCookie(cookieHeader: string | undefined | null): string | null {
  if (!cookieHeader) { return null; }
  for (const part of cookieHeader.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === SESSION_COOKIE) {
      const v = decodeURIComponentSafe(part.slice(i + 1).trim());
      return looksLikeSession(v) ? v : null;
    }
  }
  return null;
}

/** `Secure` siempre que la petición llegó por https (o detrás de un proxy que lo dice); en http local no, o el navegador la descarta. */
export function sessionCookie(token: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export function clearedCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

function decodeURIComponentSafe(v: string): string { try { return decodeURIComponent(v); } catch { return ''; } }

/** Lo que el navegador recibe de una sesión del back-office: quién es, NUNCA el token. */
export interface BuyerPublic { nombre: string | null; correo: string; desde: string; }
export function buyerOf(body: unknown): BuyerPublic | null {
  const c = (body as { comprador?: { nombre?: unknown; correo?: unknown; desde?: unknown } } | null)?.comprador;
  return c && typeof c.correo === 'string' ? { nombre: typeof c.nombre === 'string' ? c.nombre : null, correo: c.correo, desde: String(c.desde ?? '') } : null;
}
