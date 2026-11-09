import { Component, computed, inject, input, output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Icon } from './icon';

/** Modal de PDF (remisión, cotización y, desde la bala 12, los documentos del producto): el documento se ve sin sacar al comprador de la tienda,
 *  con «Descargar» y «Cerrar». Solo URLs de la propia tienda (`/…`, nunca `//`) o `https://` (el CDN de medios). */
@Component({
  selector: 'bsv-pdf-modal', imports: [Icon],
  template: `
    @if (safe(); as s) {
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pdf-title" data-component="PdfModal" (click)="$event.target === $event.currentTarget ? cerrar.emit() : null">
      <div class="modal-panel" style="max-width:920px;display:flex;flex-direction:column;gap:12px;max-height:92vh">
        <div class="between" style="gap:8px;flex-wrap:wrap"><h3 id="pdf-title" style="margin:0">{{ titulo() }}</h3>
          <div class="row" style="gap:6px"><a class="btn btn-ghost btn-sm" [href]="url()" download><bsv-icon name="download" style="--icon:16px" /> Descargar</a><button type="button" class="btn btn-ghost btn-sm" (click)="cerrar.emit()">Cerrar</button></div></div>
        <iframe [src]="s" title="{{ titulo() }}" style="width:100%;height:72vh;border:1px solid var(--color-border);border-radius:var(--radius-md);background:#fff"></iframe>
        <p class="small muted" style="margin:0">Si no se ve el documento, usa «Descargar».</p>
      </div>
    </div>
    }`,
})
export class PdfModal {
  titulo = input.required<string>(); url = input.required<string>();
  cerrar = output<void>();
  private sanitizer = inject(DomSanitizer);
  safe = computed(() => { const u = this.url(); return (u.startsWith('/') && !u.startsWith('//')) || u.startsWith('https://') ? this.sanitizer.bypassSecurityTrustResourceUrl(u) : null; });
}
