import { Component, inject, afterNextRender, DOCUMENT } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Seo } from './core/seo';
import { Header, Footer, BottomBar, Toasts, WhatsAppFloat } from './shared/ui';
import { enableMotion } from './shared/directives/motion';
import { startPresence } from './core/presence';

@Component({ selector: 'app-root', imports: [RouterOutlet, Header, Footer, BottomBar, Toasts, WhatsAppFloat], templateUrl: './app.html' })
export class App {
  constructor() {
    const d = inject(DOCUMENT), seo = inject(Seo);
    // Cada página sale con su dirección canónica y una descripción; producto, serie y categoría la afinan después.
    inject(Router).events.subscribe(e => { if (e instanceof NavigationEnd) { seo.page(e.urlAfterRedirects); } });
    afterNextRender(() => { enableMotion(d); startPresence(d); });
  }
}
