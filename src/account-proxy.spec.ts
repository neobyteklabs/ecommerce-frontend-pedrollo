import { SESSION_COOKIE, buyerOf, clearedCookie, looksLikeSession, readSessionCookie, sessionCookie } from './account-proxy';

const BUENA = 'v1.MToxMjoxNzk5OTk5OTk5.abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ';

describe('la cookie de sesión del comprador', () => {
  it('lee la sesión entre otras cookies', () => {
    expect(readSessionCookie(`otra=1; ${SESSION_COOKIE}=${BUENA}; tema=oscuro`)).toBe(BUENA);
    expect(readSessionCookie(`${SESSION_COOKIE}=${encodeURIComponent(BUENA)}`)).toBe(BUENA);
  });

  it('lo que no tiene forma de sesión no se reenvía al back-office', () => {
    for (const mala of [undefined, '', 'otra=1', `${SESSION_COOKIE}=`, `${SESSION_COOKIE}=hola`, `${SESSION_COOKIE}=v2.aaaa.bbbbbbbbbbbbbbbbbbbbbbbb`,
      `${SESSION_COOKIE}=v1.aa aa.bbbbbbbbbbbbbbbbbbbbbbbb`, `${SESSION_COOKIE}=%E0%A4%A`]) {
      expect(readSessionCookie(mala)).toBeNull();
    }
    expect(looksLikeSession(BUENA)).toBe(true);
    expect(looksLikeSession(BUENA + '\r\nSet-Cookie: x=1')).toBe(false);
  });

  it('se pone HttpOnly y SameSite=Lax siempre; Secure solo por https', () => {
    const https = sessionCookie(BUENA, true); const http = sessionCookie(BUENA, false);
    for (const c of [https, http]) { expect(c).toContain('HttpOnly'); expect(c).toContain('SameSite=Lax'); expect(c).toContain('Path=/'); expect(c).toContain('Max-Age=2592000'); }
    expect(https).toContain('Secure'); expect(http).not.toContain('Secure');
    expect(clearedCookie(true)).toContain('Max-Age=0');
  });

  it('al navegador solo le llega quién es, nunca la sesión', () => {
    const b = buyerOf({ sesion: BUENA, expira: 'x', comprador: { nombre: 'Ana', correo: 'ana@example.com', desde: '2026-11-12T00:00:00Z' } });
    expect(b).toEqual({ nombre: 'Ana', correo: 'ana@example.com', desde: '2026-11-12T00:00:00Z' });
    expect(JSON.stringify(b)).not.toContain('v1.');
    expect(buyerOf({})).toBeNull(); expect(buyerOf(null)).toBeNull();
  });
});
