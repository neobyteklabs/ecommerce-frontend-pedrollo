import { describe, expect, it } from 'vitest';
import { uuid } from './uuid';

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuid', () => {
  it('usa crypto.randomUUID cuando existe', () => {
    expect(uuid()).toMatch(V4);
  });
  it('arma un v4 válido sin crypto.randomUUID (contexto no seguro, como http por IP)', () => {
    const original = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(globalThis.crypto), 'randomUUID');
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true });
    try {
      const a = uuid(), b = uuid();
      expect(a).toMatch(V4); expect(b).toMatch(V4); expect(a).not.toBe(b);
    } finally { delete (globalThis.crypto as unknown as Record<string, unknown>)['randomUUID']; if (original) Object.defineProperty(Object.getPrototypeOf(globalThis.crypto), 'randomUUID', original); }
  });
});
