import { Component, inject, afterNextRender, DOCUMENT } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header, Footer, BottomBar, Toasts } from './shared/ui';
import { enableMotion } from './shared/directives/motion';

@Component({ selector: 'app-root', imports: [RouterOutlet, Header, Footer, BottomBar, Toasts], templateUrl: './app.html' })
export class App { constructor() { const d = inject(DOCUMENT); afterNextRender(() => enableMotion(d)); } }
