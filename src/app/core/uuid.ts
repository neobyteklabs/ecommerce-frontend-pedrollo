/**
 * UUID v4 para llaves de idempotencia. `crypto.randomUUID` solo existe en contexto seguro (https o localhost): abriendo la tienda por la IP
 * de la red (`http://192.168.x.x:4201`, el teléfono en pruebas) no está y el formulario de cotizar tronaba al construirse. `getRandomValues`
 * sí está en cualquier contexto, así que se arma el UUID a mano cuando hace falta.
 */
export function uuid(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const b = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
