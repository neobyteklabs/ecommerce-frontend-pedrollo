import { Component, inject, input, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { SessionService } from '../../core/session';
import { Icon, Alert } from '../../shared/ui';

@Component({
  selector: 'bsv-login', imports: [RouterLink, Icon, Alert],
  host: { class: 'container block', 'data-page': 'Login' },
  template: `<div class="auth" data-component="AuthCard">
    @if (expired()) { <bsv-alert kind="info" title="Tu sesión expiró" icon="clock" style="text-align:left;margin-bottom:20px" data-component="Alert/SesionExpirada">Por seguridad cerramos la sesión tras 30 minutos sin actividad. Tu carrito se guardó. Inicia sesión para continuar.</bsv-alert> }
    <div class="empty" style="padding:0 0 20px"><div class="icon"><bsv-icon [name]="gate() ? 'lock' : 'user'" style="--icon:30px" /></div>
      <h2 style="margin:0">{{ gate() ? 'Necesitas una cuenta para comprar' : 'Entra a tu cuenta' }}</h2>
      <p>{{ gate() ? 'Así podemos enviarte el rastreo, la factura y guardar tus direcciones. Toma 10 segundos: no hay contraseñas.' : 'Sin contraseñas. Usa tu cuenta de Google o Facebook.' }}</p></div>
    <div class="stack-sm">
      <button class="btn btn-oauth btn-lg btn-block" type="button" (click)="login()" data-component="Button/OAuthGoogle"><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/></svg> Continuar con Google</button>
      <button class="btn btn-oauth btn-lg btn-block" type="button" (click)="login()" data-component="Button/OAuthFacebook"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z"/></svg> Continuar con Facebook</button>
    </div>
    <p class="xs muted" style="margin:20px 0 0">Al continuar aceptas los <a routerLink="/legal" fragment="terminos">términos</a> y el <a routerLink="/legal" fragment="privacidad">aviso de privacidad</a>. No publicamos nada en tu nombre.</p>
    @if (gate()) { <p class="small" style="margin:16px 0 0"><a routerLink="/carrito">Volver al carrito</a></p> }
  </div>`,
})
export class Login {
  next = input('/cuenta'); expired = input<string>();
  gate = computed(() => (this.next() ?? '/cuenta').startsWith('/checkout'));
  private s = inject(SessionService); private r = inject(Router);
  login() { this.s.login(); this.r.navigateByUrl(this.next() ?? '/cuenta'); }
}
