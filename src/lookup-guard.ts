/**
 * Freno contra adivinar pedidos (Felipe, 18-nov): el número corto (`PED-000123`) es consecutivo, así que alguien con una lista de correos
 * podría probar pares «número + correo» hasta atinar. El límite general (30 consultas por minuto) no lo impide; este cuenta solo los
 * INTENTOS FALLIDOS (404) de seguimiento y pedidos por IP: al décimo en 15 minutos esa IP queda bloqueada otros 15. Quien se equivoca
 * un par de veces al teclear ni lo nota; quien enumera consigue, a lo mucho, 10 intentos cada cuarto de hora.
 */
export const MAX_MISSES = 10;
export const WINDOW_MS = 15 * 60_000;

export class LookupGuard {
  private readonly misses = new Map<string, { n: number; until: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  /** ¿Esta IP ya agotó sus intentos fallidos? */
  blocked(ip: string): boolean {
    const e = this.misses.get(ip);
    return !!e && e.until >= this.now() && e.n >= MAX_MISSES;
  }

  /** Anota un intento fallido. Al llegar al tope, el bloqueo dura una ventana completa desde ese momento. */
  miss(ip: string): void {
    const now = this.now(); const e = this.misses.get(ip);
    if (!e || e.until < now) { this.misses.set(ip, { n: 1, until: now + WINDOW_MS }); return; }
    e.n++;
    if (e.n >= MAX_MISSES) { e.until = now + WINDOW_MS; }
  }

  /** Limpia lo vencido (se llama cada minuto). */
  sweep(): void {
    const now = this.now();
    for (const [k, e] of this.misses) { if (e.until < now) { this.misses.delete(k); } }
  }
}
