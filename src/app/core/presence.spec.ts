import { describe, expect, it } from 'vitest';
import { newVisitorId, visitorId } from './presence';

const memoria = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, m }; };

describe('presencia', () => {
  it('el identificador son 32 hexadecimales al azar', () => {
    expect(newVisitorId()).toMatch(/^[a-f0-9]{32}$/);
    expect(newVisitorId()).not.toBe(newVisitorId());
  });
  it('se guarda una vez y se reutiliza: dos pestañas son un visitante', () => {
    const s = memoria();
    const a = visitorId(s);
    expect(visitorId(s)).toBe(a);
    expect(s.m.get('bsv_visitante')).toBe(a);
  });
  it('un valor guardado que no tiene la forma esperada se reemplaza', () => {
    const s = memoria(); s.setItem('bsv_visitante', '<script>');
    expect(visitorId(s)).toMatch(/^[a-f0-9]{32}$/);
  });
  it('con el almacenamiento bloqueado sigue habiendo identificador', () => {
    const roto = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => undefined };
    expect(visitorId(roto)).toMatch(/^[a-f0-9]{32}$/);
    expect(visitorId(null)).toMatch(/^[a-f0-9]{32}$/);
  });
});
