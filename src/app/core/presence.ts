/**
 * Presencia: le dice al servidor de la tienda «sigo aquí» cada 30 s mientras la pestaña está visible, para que el portal pueda
 * mostrar cuántos visitantes hay conectados. El identificador es un valor al azar guardado en este navegador: no es una persona,
 * no viaja con el pedido y solo sirve para no contar dos veces a quien tiene dos pestañas abiertas.
 */
const KEY = 'bsv_visitante';
export const BEAT_MS = 30_000;

export function newVisitorId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/** El identificador de este navegador; si el almacenamiento está bloqueado, uno que dura lo que la pestaña. */
export function visitorId(storage: Pick<Storage, 'getItem' | 'setItem'> | null, make: () => string = newVisitorId): string {
  try {
    const saved = storage?.getItem(KEY);
    if (saved && /^[a-f0-9]{32}$/.test(saved)) { return saved; }
    const fresh = make();
    storage?.setItem(KEY, fresh);
    return fresh;
  } catch { return make(); }
}

/** Arranca los latidos. Solo en el navegador. Devuelve cómo detenerlos. */
export function startPresence(doc: Document): () => void {
  const win = doc.defaultView;
  if (!win) { return () => undefined; }
  let storage: Storage | null = null;
  try { storage = win.localStorage; } catch { /* almacenamiento bloqueado */ }
  const id = visitorId(storage);
  const beat = () => {
    if (doc.visibilityState !== 'visible') { return; }
    win.fetch('/__latido', { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json', 'X-Tienda': '1' }, body: JSON.stringify({ v: id }) })
      .catch(() => undefined);
  };
  beat();
  const timer = win.setInterval(beat, BEAT_MS);
  doc.addEventListener('visibilitychange', beat);
  return () => { win.clearInterval(timer); doc.removeEventListener('visibilitychange', beat); };
}
