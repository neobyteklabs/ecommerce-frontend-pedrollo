import { LookupGuard, MAX_MISSES, WINDOW_MS } from "./lookup-guard";

describe("freno contra adivinar pedidos", () => {
  it("bloquea a la IP que falla demasiadas veces, y solo a esa", () => {
    let t = 0; const g = new LookupGuard(() => t);
    for (let i = 0; i < MAX_MISSES - 1; i++) { g.miss("1.1.1.1"); }
    expect(g.blocked("1.1.1.1")).toBe(false);
    g.miss("1.1.1.1");
    expect(g.blocked("1.1.1.1")).toBe(true);
    expect(g.blocked("2.2.2.2")).toBe(false);
  });

  it("el bloqueo dura una ventana completa desde el último fallo y luego se levanta", () => {
    let t = 0; const g = new LookupGuard(() => t);
    for (let i = 0; i < MAX_MISSES; i++) { t += 60_000; g.miss("1.1.1.1"); }
    t += WINDOW_MS - 1; expect(g.blocked("1.1.1.1")).toBe(true);
    t += 2; expect(g.blocked("1.1.1.1")).toBe(false);
    g.sweep(); g.miss("1.1.1.1"); expect(g.blocked("1.1.1.1")).toBe(false);
  });

  it("unos cuantos errores al teclear no bloquean, y se olvidan al pasar la ventana", () => {
    let t = 0; const g = new LookupGuard(() => t);
    for (let i = 0; i < 4; i++) { g.miss("1.1.1.1"); }
    t += WINDOW_MS + 1;
    for (let i = 0; i < MAX_MISSES - 1; i++) { g.miss("1.1.1.1"); }
    expect(g.blocked("1.1.1.1")).toBe(false);
  });
});
