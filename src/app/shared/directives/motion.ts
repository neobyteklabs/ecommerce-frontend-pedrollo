import { Directive, ElementRef, inject, input, afterNextRender, PLATFORM_ID, DestroyRef, HostListener, DOCUMENT } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Activa html.motion una sola vez en el navegador (motion.css cuelga de esa clase). */
export function enableMotion(doc: Document) { doc.documentElement.classList.add('motion'); }

/** [bsvReveal]: entra con fundido/subida al hacer scroll. Valor opcional: '' | 'scale' | 'left'. Escalonado con [revealIndex]. */
@Directive({ selector: '[bsvReveal]' })
export class Reveal {
  bsvReveal = input<'' | 'scale' | 'left'>('');
  revealIndex = input<number>(0);
  private el = inject(ElementRef<HTMLElement>).nativeElement;
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  private doc = inject(DOCUMENT);
  private destroy = inject(DestroyRef);
  constructor() {
    afterNextRender(() => {
      if (!this.browser) return;
      enableMotion(this.doc);
      this.el.setAttribute('data-reveal', this.bsvReveal());
      this.el.style.setProperty('--i', String(Math.min(this.revealIndex(), 8)));
      const done = () => { this.el.classList.add('is-in'); setTimeout(() => this.el.removeAttribute('data-reveal'), 1400); };
      if (reduced()) { done(); return; }
      const r = this.el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) { done(); return; }
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { done(); io.disconnect(); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      io.observe(this.el);
      this.destroy.onDestroy(() => io.disconnect());
    });
  }
}

/** [bsvSpotlight]: foco de luz que sigue al cursor (variables --mx/--my leídas por ::before en motion.css). */
@Directive({ selector: '[bsvSpotlight]' })
export class Spotlight {
  private el = inject(ElementRef<HTMLElement>).nativeElement;
  @HostListener('pointermove', ['$event']) move(e: PointerEvent) {
    const r = this.el.getBoundingClientRect();
    this.el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); this.el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }
}

/** [bsvCountUp]: cuenta desde 0 hasta la cifra del texto ("60 m", "2.4 m³/h") al entrar en pantalla. */
@Directive({ selector: '[bsvCountUp]' })
export class CountUp {
  private el = inject(ElementRef<HTMLElement>).nativeElement;
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  constructor() {
    afterNextRender(() => {
      if (!this.browser || reduced()) return;
      const m = this.el.textContent!.trim().match(/^([\d.,]+)(.*)$/); if (!m) return;
      const target = parseFloat(m[1].replace(',', '')); const dec = (m[1].split('.')[1] || '').length; const suffix = m[2];
      const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.disconnect(); const t0 = performance.now();
        const tick = (t: number) => { const p = Math.min(1, (t - t0) / 1100); this.el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dec) + suffix; if (p < 1) requestAnimationFrame(tick); }; tick(t0); }), { threshold: .5 });
      io.observe(this.el);
    });
  }
}
