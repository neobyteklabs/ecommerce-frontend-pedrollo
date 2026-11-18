/**
 * Direcciones del sitio anterior (WordPress) que los buscadores todavía recuerdan. Las listas de precios en PDF
 * (`/wp-content/uploads/AAAA/MM/LP-<FAMILIA>-SP.pdf`) eran lo que aparecía en Google: se mandan, con redirección permanente, a la
 * categoría que hoy vende esa familia; así no se pierde la posición ganada ni cae nadie en «página no encontrada». Un PDF que no se
 * reconoce va al catálogo. El resto de WordPress (imágenes, panel, feeds) ya no existe: 410, sin gastar un render de Angular.
 */
export type LegacyAnswer = { redirect: string } | { gone: true } | null;

/** Palabra del nombre del archivo → categoría de la tienda. El orden importa: gana la primera que aparezca. */
const FAMILIES: readonly (readonly [RegExp, string])[] = [
  [/TANQUE/, '/categoria/tanques-precargados'],
  [/PRESURIZ|HIDRONEUM/, '/categoria/presurizacion'],
  [/POZO|SUMERGIBLES?-4|4SR/, '/categoria/pozo-profundo'],
  [/SUMERGIBLE|DRENAJE/, '/categoria/sumergibles-para-drenaje'],
  [/PERIFERIC/, '/categoria/perifericas'],
  [/MULTIETAPA/, '/categoria/multietapas'],
  [/AUTOCEBANTE/, '/categoria/autocebantes'],
  [/CENTRIFUG/, '/categoria/centrifugas'],
  [/PISCINA|ALBERCA/, '/categoria/piscinas'],
  [/VARIADOR|CONTROL|TABLERO/, '/categoria/variadores-y-controles'],
  [/ACCESORIO/, '/categoria/accesorios'],
];

const WORDPRESS_RE = /^\/(wp-content|wp-includes|wp-admin|wp-json)(\/|$)|^\/(wp-login|xmlrpc|wp-cron)\.php$/i;

export function legacyAnswer(path: string): LegacyAnswer {
  if (!WORDPRESS_RE.test(path)) { return null; }
  if (!/^\/wp-content\/uploads\/.+\.pdf$/i.test(path)) { return { gone: true }; }
  const file = path.slice(path.lastIndexOf('/') + 1).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return { redirect: FAMILIES.find(([re]) => re.test(file))?.[1] ?? '/catalogo' };
}
