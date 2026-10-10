import familias from './data/familias_crm.json';

/** Familias y series reales del CRM (familias_crm.json). Slug = familia normalizada. */
export interface SerieCrm { familia: string; serie: string; n: number; ejemplos: string[]; }
export interface Family { slug: string; name: string; desc: string; series: SerieCrm[]; }

const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Familias que aparecen en navegación y catálogo, con nombre comercial y descripción corta. */
const FAMILY_META: Record<string, { name: string; desc: string }> = {
  'perifericas': { name: 'Periféricas', desc: 'Pequeñas, silenciosas y económicas para casa habitación: PK, PKS, CK.' },
  'centrifugas': { name: 'Centrífugas', desc: 'CP, F, FG, HF y NGA para abastecimiento, riego y uso industrial.' },
  'centrifugas-en-acero-inox': { name: 'Centrífugas en acero inoxidable', desc: 'AL-RED, F INOX y NGA-PRO para líquidos limpios y aplicaciones alimentarias.' },
  'autocebantes': { name: 'Autocebantes', desc: 'JSW, JCR y JDW: arrancan solas aunque la tubería tenga aire.' },
  'multietapas': { name: 'Multietapas', desc: '2CP de doble rodete, 3-4CP, HT y MK: más presión con el mismo motor.' },
  'pozo-profundo': { name: 'Pozo profundo', desc: 'Sumergibles 4SR, 4PD, 6PD, motores y kits completos para pozo.' },
  'sumergibles-para-drenaje': { name: 'Sumergibles para drenaje', desc: 'TOP, VX, MC, TRITUS y SAR para aguas limpias, sucias y cárcamos.' },
  'presurizacion': { name: 'Presurización', desc: 'Equipos hidroneumáticos EASYPUMP, HYDROFRESH, DG BLU y PUMP MASTER.' },
  'piscinas': { name: 'Piscinas', desc: 'MAGNIFICA, MAXIMA y PRIMA con prefiltro integrado.' },
  'tanques-precargados': { name: 'Tanques precargados', desc: 'Membrana MR y diafragma DF, verticales, horizontales e in-line.' },
  'variadores-y-controles': { name: 'Variadores y controles', desc: 'EASYPRESS, STEADYPRES, PRO-DG y E1/E2 para presión constante.' },
  'accesorios': { name: 'Accesorios', desc: 'Válvulas, flotadores, manómetros, sellos mecánicos y refacciones.' },
};

const grouped = new Map<string, SerieCrm[]>();
for (const s of familias as SerieCrm[]) { const k = slugify(s.familia); if (!FAMILY_META[k]) continue; grouped.set(k, [...(grouped.get(k) ?? []), s]); }

export const FAMILIES: Family[] = Object.keys(FAMILY_META).map(slug => ({ slug, ...FAMILY_META[slug], series: grouped.get(slug) ?? [] }));
export const familyBySlug = (slug: string) => FAMILIES.find(f => f.slug === slug);
export const NAV_FAMILIES = ['perifericas', 'centrifugas', 'multietapas', 'pozo-profundo', 'sumergibles-para-drenaje', 'presurizacion'];

/** Contenido narrativo de páginas de serie (tipo apple.com/macbook-pro).
 *  Regla: solo cifras que estén en la ficha técnica 60 Hz del banco. Lo que no esté, no se escribe. */
export interface SeriesContent {
  slug: string; name: string; family: string; kicker: string; headline: [string, string]; sub: string; buyId: string;
  highlights: string[];
  tabs: { name: string; slot: string; text: string }[];
  perf: { head: string; lead: string; stats: { pre: string; big: string; post: string; fn: string }[] };
  eng: { head: string; lead: string; tiles: { w: 2 | 3 | 4 | 6; tone?: 'light' | 'ivory'; eyebrow: string; title: string; text: string; slot?: string }[] };
  compare: { head: string; lead: string; models: string[] };
  specs: [string, string][][];
}

export const SERIES: Record<string, SeriesContent> = {
  '2cp': {
    slug: '2cp', name: 'Serie 2CP', family: 'multietapas', kicker: 'Serie 2CP · Electrobombas centrífugas de doble rodete',
    headline: ['Dos rodetes.', 'El doble de presión.'],
    sub: 'Dos impulsores en serie para aguas limpias: distribución de agua con vaso de expansión, aumento de presión de red y grupos contra incendio.',
    buyId: '2cp-32-210a',
    highlights: ['Doble rodete', 'Altura hasta 112 m', 'Caudal hasta 450 l/min', 'Trifásica 220/440 V', 'Líquido hasta +90 °C', 'Presión máx. 10 bar'],
    tabs: [
      { name: 'Hidráulica', slot: 'serie-2cp-hero', text: 'Dos impulsores montados en serie sobre el mismo eje: el primero entrega el agua al segundo ya presurizada. Así la serie alcanza hasta 112 m de altura manométrica (ficha 60 Hz).' },
      { name: 'Usos', slot: 'detalle-2cp-usos · instalación con vaso de expansión', text: 'Recomendada para agua limpia y líquidos no agresivos: distribución de agua en combinación con vaso de expansión, aumento de presión de red y grupos de extinción de incendios, en los sectores doméstico, civil e industrial.' },
      { name: 'Límites de uso', slot: 'detalle-2cp-limites · cuerpo de bomba', text: 'Altura de aspiración manométrica hasta 7 m. Temperatura del líquido de −10 °C a +90 °C y ambiente de −10 °C a +40 °C. Presión máxima en el cuerpo de la bomba: 10 bar.' },
      { name: 'A pedido', slot: 'detalle-2cp-pedido · sello mecánico', text: 'Ejecuciones especiales bajo pedido: sello mecánico especial, diferente voltaje o frecuencia y protección IPX5.' },
    ],
    perf: {
      head: 'Presión para subir donde una sola etapa se queda corta.', lead: 'Datos de la ficha técnica 60 Hz, HS = 0 m. Elige el modelo por la altura a vencer y el caudal que necesitas.',
      stats: [{ pre: 'Altura hasta', big: '112 m', post: 'modelo 2CP 32/210A', fn: 'Ficha 60 Hz, Q = 0' }, { pre: 'Caudal hasta', big: '450 l/min', post: '27 m³/h · modelos 2CP 40', fn: 'Ficha 60 Hz' }, { pre: 'Potencias', big: '4 – 15 HP', post: 'de 3 a 11 kW, trifásicas', fn: '2CP 32/200C a 2CP 40/200A' }],
    },
    eng: {
      head: 'Ingeniería que se nota en el manómetro.', lead: 'Lo que dice la ficha técnica, sin adornos.',
      tiles: [
        { w: 4, eyebrow: 'Hidráulica', title: 'Dos rodetes en serie. Una sola carcasa.', text: 'Cada etapa aporta parte de la altura total; la curva de la 2CP 32/210A arranca en 112 m y entrega 90 m a 200 l/min.', slot: 'tile-2cp-corte · corte transversal de la hidráulica' },
        { w: 2, eyebrow: 'Eficiencia', title: 'Motores IE3.', text: 'Los modelos 2CP 32/200B, 32/210 y 40/180B llevan motor de eficiencia IE3 según la ficha.' },
        { w: 2, tone: 'ivory', eyebrow: 'Tensión', title: '220 / 380 / 440 V.', text: 'Trifásica, 60 Hz. Consumos por modelo en la ficha técnica.' },
        { w: 2, tone: 'light', eyebrow: 'Temperatura', title: 'Hasta +90 °C.', text: 'Apta para agua caliente sanitaria y procesos industriales.' },
        { w: 2, eyebrow: 'Presión', title: '10 bar en el cuerpo.', text: 'Presión máxima de trabajo del cuerpo de bomba.' },
        { w: 6, tone: 'light', eyebrow: 'Datos', title: 'Todo lo demás está en la ficha.', text: 'Curvas H-Q, NPSH, potencia absorbida, dimensiones y pesos, modelo por modelo. Descárgala desde cualquier ficha de producto de la serie.' },
      ],
    },
    compare: { head: '¿Cuál 2CP es para ti?', lead: 'Modelos de la ficha 60 Hz. Las especificaciones salen de la ficha; precio y disponibilidad los confirma BSV.', models: ['2cp-32-210b', '2cp-32-210a', '2cp-25-16a'] },
    specs: [[['Tipo', 'Centrífuga de doble rodete'], ['Caudal', 'hasta 450 l/min (27 m³/h)'], ['Altura', 'hasta 112 m'], ['Aspiración manométrica', 'hasta 7 m']], [['Temperatura del líquido', '−10 °C a +90 °C'], ['Temperatura ambiente', '−10 °C a +40 °C'], ['Presión máx. en el cuerpo', '10 bar'], ['Frecuencia', '60 Hz']]],
  },
};
