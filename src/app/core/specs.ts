/**
 * Datos técnicos de un producto, leídos de la descripción del catálogo.
 *
 * El catálogo no trae la altura o el caudal en campos: los trae escritos en una frase con forma fija, que sale de la lista de
 * precios («…de 1.0 HP, versión monofásica, a 115 V, 60 Hz, carga de 34÷21 m, caudal de 10÷100 L/min, succión de 1" y descarga
 * de 1"»). Aquí se leen para armar la tabla de la ficha. Lo que la frase no dice no se inventa: esa fila no sale.
 */
export interface SpecRow { id: 'hp' | 'fase' | 'voltaje' | 'frecuencia' | 'etapas' | 'altura' | 'caudal' | 'succion' | 'descarga' | 'solidos' | 'capacidad'; label: string; value: string; }

const num = (s: string) => String(parseFloat(s));
const rango = (a: string, b: string | undefined, unidad: string) => b ? `de ${num(a)} a ${num(b)} ${unidad}` : `${num(a)} ${unidad}`;
/** Diámetro de rosca: `1`, `1¼`, `2½`, `1 1/2`. La comilla de pulgadas a veces se perdió en la lista; se pone siempre. */
const PULG = String.raw`(\d+(?:[½¼¾]| \d/\d)?)\s*(?:"|”|pulg)?`;

export function specsFromDescription(description: string | null | undefined): SpecRow[] {
  const t = description ?? ''; const out: SpecRow[] = []; let m: RegExpMatchArray | null;
  const add = (id: SpecRow['id'], label: string, value: string) => { out.push({ id, label, value }); };
  if ((m = t.match(/\bde (\d+(?:\.\d+)?) ?HP\b/i))) { add('hp', 'Potencia', `${num(m[1])} HP`); }
  if ((m = t.match(/\b(?:versión|motor) (monofásic[ao]|trifásic[ao])/i))) { add('fase', 'Fase', /^mono/i.test(m[1]) ? 'Monofásica' : 'Trifásica'); }
  if ((m = t.match(/\ba (\d{2,3}(?:\/\d{2,3})*) ?V\b/))) { add('voltaje', 'Tensión', `${m[1].replace(/\//g, ' / ')} V`); }
  if ((m = t.match(/\b(\d{2}) ?Hz\b/))) { add('frecuencia', 'Frecuencia', `${m[1]} Hz`); }
  if ((m = t.match(/\b(\d+) etapas\b/i))) { add('etapas', 'Etapas', m[1]); }
  if ((m = t.match(/\bcarga de ([\d.]+)(?:÷([\d.]+))? ?m\b/i))) { add('altura', 'Altura (carga)', rango(m[1], m[2], 'm')); }
  if ((m = t.match(/\bcaudal de ([\d.]+)(?:÷([\d.]+))? ?(L\/min|m³\/h)/i))) { add('caudal', 'Caudal', rango(m[1], m[2], /m³/i.test(m[3]) ? 'm³/h' : 'L/min')); }
  if ((m = t.match(new RegExp(String.raw`\bsucción de ${PULG}`, 'i')))) { add('succion', 'Succión', `${m[1]}"`); }
  if ((m = t.match(new RegExp(String.raw`\bdescarga de ${PULG}`, 'i')))) { add('descarga', 'Descarga', `${m[1]}"`); }
  if ((m = t.match(/\bpaso de sólidos de (\d+) ?mm\b/i))) { add('solidos', 'Paso de sólidos', `${m[1]} mm`); }
  if ((m = t.match(/\bcapacidad de (\d+) ?(?:l|litros)\b/i))) { add('capacidad', 'Capacidad', `${m[1]} L`); }
  return out;
}

/** Lo esencial en una línea, para la descripción que muestran los buscadores: «1 HP, 115 V, hasta 34 m, hasta 100 L/min». */
export function specSummary(rows: SpecRow[]): string {
  const v = (id: SpecRow['id']) => rows.find(r => r.id === id)?.value;
  const tope = (s: string | undefined) => { if (!s) { return null; } const n = [...s.matchAll(/[\d.]+/g)].map(x => parseFloat(x[0])); const u = s.replace(/^.*\d\s*/, ''); return n.length ? `hasta ${Math.max(...n)} ${u}` : null; };
  return [v('hp')?.split(' · ')[0], v('voltaje'), tope(v('altura')), tope(v('caudal'))].filter(Boolean).join(', ');
}

/**
 * La descripción del catálogo, lista para leerse: sin el arranque «… Marca PEDROLLO Modelo X,» que solo repite el título de la
 * ficha, y con mayúscula inicial. Si no queda nada que decir, `null`.
 */
export function readableDescription(description: string | null | undefined): string | null {
  const t = (description ?? '').replace(/\s+/g, ' ').trim();
  if (!t) { return null; }
  const s = t.replace(/÷/g, ' a ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
