import { describe, expect, it } from 'vitest';
import { imageFor } from './images';

describe('imageFor (huecos de imagen)', () => {
  it('el hero aprobado de la 2CP sigue saliendo del manifiesto del banco', () => {
    expect(imageFor('serie-2cp-hero')).toContain('media/comercial/');
    expect(imageFor('serie-2cp-hero · hero cinematográfico pendiente · 2560×1440')).toContain('media/comercial/');
  });
  it('un hueco sin imagen instalada queda como placeholder (null)', () => {
    expect(imageFor('serie-pk-prestaciones · imagen pendiente')).toBeNull();
    expect(imageFor('serie-noexiste-hero')).toBeNull();
  });
});
