import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';

/** Quién es el comprador, tal como lo dice el servidor de la tienda. La sesión misma vive en una cookie HttpOnly que este código no puede leer. */
export interface Buyer { nombre: string | null; correo: string; desde: string; }
export interface AccountOrder { folio: string; numero: string; estado: string; estadoTienda: string | null; total: number; piezas: number; creado: string; }

/**
 * La cuenta del comprador (bala 9). No hay contraseñas ni tokens en el navegador: se entra con Google, el servidor de la tienda
 * valida la credencial con el back-office y deja la sesión en una cookie HttpOnly. Aquí solo se sabe «hay alguien» y «quién es».
 *
 * En el render del servidor no hay sesión que consultar (no se reenvía la cookie): `user` empieza en null y se resuelve en el
 * navegador con `load()`. Por eso la guarda deja pasar en el servidor y decide en el navegador.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  private pending: Promise<Buyer | null> | null = null;
  readonly user = signal<Buyer | null>(null);
  /** true cuando ya se le preguntó al servidor (haya o no sesión). */
  readonly resolved = signal(false);

  /** Pregunta una sola vez quién soy; las llamadas simultáneas comparten la respuesta. */
  load(force = false): Promise<Buyer | null> {
    if (!this.browser) { return Promise.resolve(null); }
    if (this.pending && !force) { return this.pending; }
    this.pending = fetch('/__cuenta/yo', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(async r => r.ok ? ((await r.json()) as { comprador: Buyer | null }).comprador : null)
      .catch(() => null)
      .then(b => { this.user.set(b); this.resolved.set(true); return b; });
    return this.pending;
  }

  /** Entra con la credencial que entregó el botón de Google. Lanza con el mensaje para mostrar si no se pudo. */
  async signIn(credential: string): Promise<Buyer> {
    const r = await fetch('/__cuenta/entrar', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Tienda': '1' }, body: JSON.stringify({ credential }) });
    const body = await r.json().catch(() => null) as { comprador?: Buyer; message?: string } | null;
    if (!r.ok || !body?.comprador) { throw new Error(body?.message ?? 'No pudimos iniciar tu sesión. Inténtalo de nuevo.'); }
    this.user.set(body.comprador); this.resolved.set(true); this.pending = Promise.resolve(body.comprador);
    return body.comprador;
  }

  async orders(): Promise<AccountOrder[]> {
    const r = await fetch('/__cuenta/pedidos', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (r.status === 401) { this.user.set(null); throw new Error('sesion'); }
    if (!r.ok) { throw new Error('No pudimos cargar tus pedidos. Inténtalo en un momento.'); }
    return await r.json() as AccountOrder[];
  }

  async logout(): Promise<void> {
    if (this.browser) { await fetch('/__cuenta/salir', { method: 'POST', credentials: 'same-origin', headers: { 'X-Tienda': '1' } }).catch(() => undefined); }
    this.user.set(null); this.pending = Promise.resolve(null);
  }
}

export const authGuard: CanActivateFn = async (_route, state) => {
  const s = inject(SessionService); const r = inject(Router);
  if (!isPlatformBrowser(inject(PLATFORM_ID))) { return true; }
  return (await s.load()) ? true : r.createUrlTree(['/login'], { queryParams: { next: state.url } });
};
