import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, computed, inject, input, signal, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { SessionService } from '../../core/session';
import { Icon, Alert } from '../../shared/ui';

/** Lo mínimo del SDK de Google Identity Services que se usa aquí. */
interface GoogleId { initialize(o: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: string; auto_select?: boolean }): void; renderButton(el: HTMLElement, o: Record<string, unknown>): void; cancel(): void; }
const GSI_SRC = 'https://accounts.google.com/gsi/client';

/**
 * Entrar con Google (bala 9). El botón es el oficial de Google: entrega una credencial firmada que se manda al servidor de la tienda;
 * el back-office la verifica y la sesión queda en una cookie que esta página no puede leer. Registrarse y entrar son el mismo acto.
 * La cuenta es opcional: se puede comprar sin ella.
 */
@Component({
  selector: 'bsv-login', imports: [RouterLink, Icon, Alert],
  host: { class: 'container block', 'data-page': 'Login' },
  template: `<div class="auth" data-component="AuthCard">
    <div class="empty" style="padding:0 0 20px"><div class="icon"><bsv-icon name="user" style="--icon:30px" /></div>
      <h1 style="margin:0;font-size:var(--text-xl)">Entra a tu cuenta</h1>
      <p>Con tu cuenta de Google, sin contraseñas nuevas. Si es tu primera vez, la cuenta se crea al entrar.</p></div>
    @if (error()) { <bsv-alert kind="danger" title="No pudimos iniciar tu sesión" icon="alert" style="text-align:left;margin-bottom:16px" data-component="Alert/LoginError">{{ error() }}</bsv-alert> }
    @switch (estado()) {
      @case ('cargando') { <p class="muted small" data-testid="login-cargando">Preparando el acceso…</p> }
      @case ('listo') { <div #boton class="google-btn" data-testid="login-google" [attr.aria-busy]="entrando()"></div>@if (entrando()) { <p class="muted small">Verificando tu cuenta…</p> } }
      @case ('sin-cuentas') { <bsv-alert kind="info" title="Las cuentas aún no están disponibles" icon="info" style="text-align:left" data-testid="login-sin-cuentas">Mientras tanto puedes comprar como invitado y seguir tu pedido con su número y tu correo.</bsv-alert> }
      @case ('fallo') { <bsv-alert kind="warning" title="No se pudo cargar el acceso con Google" icon="alert" style="text-align:left" data-testid="login-fallo">Revisa tu conexión o desactiva el bloqueador para este sitio y vuelve a intentarlo. También puedes comprar como invitado.</bsv-alert> }
    }
    <p class="small" style="margin:20px 0 0">¿Solo quieres ver un pedido? <a routerLink="/seguimiento">Rastréalo con su número</a>, sin cuenta.</p>
    <p class="xs muted" style="margin:12px 0 0">Al entrar aceptas los <a routerLink="/terminos">términos</a> y el <a routerLink="/privacidad">aviso de privacidad</a>. De Google recibimos tu nombre y tu correo; no publicamos nada en tu nombre.</p>
  </div>`,
  styles: [`.google-btn{display:flex;justify-content:center;min-height:44px}`],
})
export class Login implements AfterViewInit, OnDestroy {
  next = input('/cuenta');
  private s = inject(SessionService); private r = inject(Router); private browser = isPlatformBrowser(inject(PLATFORM_ID));
  private boton = viewChild<ElementRef<HTMLElement>>('boton');
  estado = signal<'cargando' | 'listo' | 'sin-cuentas' | 'fallo'>('cargando'); error = signal<string | null>(null); entrando = signal(false);
  private destino = computed(() => { const n = this.next() ?? '/cuenta'; return n.startsWith('/') && !n.startsWith('//') ? n : '/cuenta'; });
  private google: GoogleId | null = null;

  async ngAfterViewInit() {
    if (!this.browser) { return; }
    if (await this.s.load()) { void this.r.navigateByUrl(this.destino()); return; }
    try {
      const { googleClientId } = await (await fetch('/__config')).json() as { googleClientId?: string | null };
      if (!googleClientId) { this.estado.set('sin-cuentas'); return; }
      this.google = await cargarGoogle();
      this.google.initialize({ client_id: googleClientId, callback: r => void this.entrar(r.credential), ux_mode: 'popup', auto_select: false });
      this.estado.set('listo');
      // El contenedor del botón aparece en el siguiente ciclo de render.
      setTimeout(() => { const el = this.boton()?.nativeElement; if (el && this.google) { this.google.renderButton(el, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', locale: 'es-419', width: 320 }); } });
    } catch { this.estado.set('fallo'); }
  }

  private async entrar(credential?: string) {
    if (!credential) { this.error.set('Google no entregó la credencial. Inténtalo de nuevo.'); return; }
    this.entrando.set(true); this.error.set(null);
    try { await this.s.signIn(credential); await this.r.navigateByUrl(this.destino()); }
    catch (e) { this.error.set((e as Error).message); }
    finally { this.entrando.set(false); }
  }

  ngOnDestroy() { try { this.google?.cancel(); } catch { /* nada que cancelar */ } }
}

let cargando: Promise<GoogleId> | null = null;
/** Carga el SDK de Google una sola vez. Falla si lo bloquea la red o una extensión. */
function cargarGoogle(): Promise<GoogleId> {
  const ya = (window as unknown as { google?: { accounts?: { id?: GoogleId } } }).google?.accounts?.id;
  if (ya) { return Promise.resolve(ya); }
  cargando ??= new Promise<GoogleId>((ok, mal) => {
    const s = document.createElement('script'); s.src = GSI_SRC; s.async = true; s.defer = true;
    s.onload = () => { const g = (window as unknown as { google?: { accounts?: { id?: GoogleId } } }).google?.accounts?.id; if (g) { ok(g); } else { cargando = null; mal(new Error('sdk')); } };
    s.onerror = () => { cargando = null; mal(new Error('red')); };
    document.head.appendChild(s);
  });
  return cargando;
}
