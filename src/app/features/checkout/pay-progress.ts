import { Component, input, signal, afterNextRender, DestroyRef, inject } from '@angular/core';

/** «Procesando pago» (bala 5d, Felipe): ilustración animada tarjeta → candado → palomita en bucle, barra indeterminada y una frase
 *  que rota. Solo CSS y SVG inline; con `prefers-reduced-motion` la animación se detiene y queda el texto. `done` congela la
 *  palomita (se usa ~600 ms antes de ir a «Gracias»). */
@Component({
  selector: 'bsv-pay-progress',
  host: { class: 'pay-progress', '[class.is-done]': 'done()', role: 'status', 'aria-live': 'polite', 'data-component': 'PayProgress' },
  template: `
  <div class="pp-stage" aria-hidden="true">
    <svg class="pp-ico pp-card" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="38" height="26" rx="4"/><path d="M5 19h38M12 29h8"/></svg>
    <svg class="pp-ico pp-lock" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="21" width="28" height="20" rx="4"/><path d="M16 21v-5a8 8 0 0 1 16 0v5"/><circle cx="24" cy="31" r="2.2"/></svg>
    <svg class="pp-ico pp-check" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="19"/><path class="pp-tick" d="M15 24.5l6.5 6.5L33 18"/></svg>
  </div>
  <div class="pp-bar"><span></span></div>
  <p class="pp-text">{{ done() ? 'Pago confirmado' : phrases[i()] }}</p>`,
})
export class PayProgress {
  done = input(false);
  phrases = ['Confirmando con tu banco…', 'Apartando tu mercancía…', 'Generando tu pedido…'];
  i = signal(0);
  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const id = setInterval(() => this.i.update(v => (v + 1) % this.phrases.length), reduced ? 3500 : 2200);
      destroy.onDestroy(() => clearInterval(id));
    });
  }
}
