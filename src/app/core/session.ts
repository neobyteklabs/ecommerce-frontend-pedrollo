import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';

/** Sesión simulada. En producción: OIDC (Google/Facebook) con tokens en cookie httpOnly. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly user = signal<{ name: string; email: string } | null>(this.browser && localStorage.getItem('bsv.user') ? { name: 'Laura', email: 'laura.mendoza@gmail.com' } : null);
  login() { this.user.set({ name: 'Laura', email: 'laura.mendoza@gmail.com' }); if (this.browser) localStorage.setItem('bsv.user', '1'); }
  logout() { this.user.set(null); if (this.browser) localStorage.removeItem('bsv.user'); }
}

export const authGuard: CanActivateFn = (route, state) => {
  const s = inject(SessionService); const r = inject(Router);
  return s.user() ? true : r.createUrlTree(['/login'], { queryParams: { next: state.url } });
};
