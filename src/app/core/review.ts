import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Modo revisión: con ?revision=1 (se recuerda en sessionStorage) la tienda muestra recursos "pendiente aprobacion"
 *  y modelos no confirmados en CRM, siempre con etiqueta visible. Sin él, no se publican. */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly on = signal(false);
  constructor() {
    if (!this.browser) return;
    const q = new URLSearchParams(location.search).get('revision');
    if (q === '1') sessionStorage.setItem('bsv.revision', '1'); if (q === '0') sessionStorage.removeItem('bsv.revision');
    this.on.set(sessionStorage.getItem('bsv.revision') === '1');
  }
  toggle() { this.on.update(v => !v); if (this.browser) { this.on() ? sessionStorage.setItem('bsv.revision', '1') : sessionStorage.removeItem('bsv.revision'); } }
}
