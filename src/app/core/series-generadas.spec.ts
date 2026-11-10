import { describe, expect, it } from 'vitest';
import { SERIES } from './catalog';
import { RESOURCES } from './resources';

/** 10-nov: toda serie del manifiesto tiene el contenido de la página larga (generado o escrito a mano). */
describe('contenido de las páginas de serie', () => {
  const slugs = [...new Set(RESOURCES.flatMap(f => f.series.map(s => s.slug)))];

  it('lo escrito a mano gana sobre lo generado (2CP)', () => {
    expect(SERIES['2cp'].headline).toEqual(['Dos rodetes.', 'El doble de presión.']);
    expect(SERIES['2cp'].source).toBeUndefined();
  });

  it('las series del catálogo tienen contenido completo para la plantilla', () => {
    const con = slugs.filter(s => SERIES[s]);
    expect(con.length).toBeGreaterThanOrEqual(90);
    for (const s of con) {
      const c = SERIES[s];
      expect(c.tabs.length, s).toBeGreaterThan(0);          // la plantilla lee c.tabs[0] sin guarda
      expect(c.headline.length, s).toBe(2);
      expect(c.highlights.length, s).toBeGreaterThan(0);
      expect(c.specs.length, s).toBe(2);
      expect(c.buyId, s).toBeTruthy();
      for (const st of c.perf.stats) { expect(st.big.length, s).toBeLessThanOrEqual(22); }
    }
  });

  it('una serie con datos de la web trae prestaciones y su fuente; una sin web no inventa cifras', () => {
    expect(SERIES['pk'].perf.stats.map(x => x.pre)).toContain('Caudal');
    expect(SERIES['pk'].source).toContain('pedrollo.com.mx');
    expect(SERIES['sellos-mecanicos'].perf.stats).toEqual([]);
    expect(SERIES['sellos-mecanicos'].eng.tiles).toEqual([]);
  });
});
