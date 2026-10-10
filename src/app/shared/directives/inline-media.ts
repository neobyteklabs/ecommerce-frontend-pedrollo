import { Directive, ElementRef, inject, input, afterNextRender, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * [bsvInlineMedia] — vídeo inline controlado por scroll, al estilo apple.com (data-inline-media).
 *
 *   <video bsvInlineMedia [src]="url" anchor=".s-hero" load="150vh" play="60vh" mode="play" muted playsinline preload="none"></video>
 *
 *  · load  : distancia antes del ancla a la que se asigna `src` y se hace preload (equivale a load-keyframe "a0t - 150vh").
 *  · play  : distancia antes del ancla a la que arranca la reproducción (play-keyframe "a0t - 60vh" … "a0b").
 *  · mode  : 'play'  → reproduce al entrar, pausa y reinicia al salir (AnimPlay + reset-on-exit).
 *            'scrub' → currentTime sigue el progreso de scroll del ancla (vista de producto fotograma a fotograma).
 *  · loop  : en modo play, repetir mientras esté visible.
 *  Respeta prefers-reduced-motion: en 'play' muestra el primer fotograma sin reproducir; en 'scrub' muestra el último.
 */
@Directive({ selector: 'video[bsvInlineMedia]' })
export class InlineMedia {
  src = input.required<string>();
  anchor = input<string>('');          // selector del bloque ancla; por defecto el propio vídeo
  load = input<string>('150vh');
  play = input<string>('60vh');
  mode = input<'play' | 'scrub'>('play');
  loop = input<boolean>(false);

  private el = inject(ElementRef<HTMLVideoElement>).nativeElement;
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  private destroy = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (!this.browser) return;
      const v = this.el; v.muted = true; v.playsInline = true; v.setAttribute('preload', 'none');
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const anchorEl = (this.anchor() && (v.closest(this.anchor()) || document.querySelector(this.anchor()))) as HTMLElement || v;
      const px = (s: string) => s.endsWith('vh') ? parseFloat(s) / 100 * innerHeight : parseFloat(s);
      let loaded = false, playing = false;

      let ready = false;
      const ensureLoaded = () => { if (loaded) return; loaded = true; v.src = this.src(); v.load(); };
      v.addEventListener('loadeddata', () => { ready = true; v.classList.add('is-loaded'); onScroll(); }, { once: true });
      v.addEventListener('play', () => v.classList.add('is-playing')); v.addEventListener('pause', () => v.classList.remove('is-playing'));
      const onScroll = () => {
        const r = anchorEl.getBoundingClientRect();
        v.dataset['ims'] = `loaded=${loaded} ready=${ready} playing=${playing} top=${Math.round(r.top)} bottom=${Math.round(r.bottom)}`;  // estado para QA
        // load-keyframe: [top - load, bottom + load]
        if (r.top < innerHeight + px(this.load()) && r.bottom > -px(this.load())) ensureLoaded();
        if (!loaded || !ready) return;
        if (this.mode() === 'scrub') {
          if (!v.duration) return;
          const total = r.height + innerHeight; const progress = Math.min(1, Math.max(0, (innerHeight - r.top) / total));
          v.currentTime = reduce ? v.duration : progress * v.duration;
          return;
        }
        // play-keyframe: [top - play, bottom]
        const inPlay = r.top < innerHeight + px(this.play()) && r.bottom > 0;
        // Si el navegador rechaza el autoplay (política sin interacción), se reintenta en el siguiente scroll.
        if (inPlay && !playing) { playing = true; if (!reduce) { v.loop = this.loop(); v.play().catch(() => { playing = false; }); } }
        else if (!inPlay && playing) { playing = false; v.pause(); v.currentTime = 0; }  // reset-on-exit
      };
      addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();
      this.destroy.onDestroy(() => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); v.pause(); });
    });
  }
}
