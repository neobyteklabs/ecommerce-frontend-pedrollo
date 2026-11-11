import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeriesRail } from './series-rail';

describe('bsv-series-rail', () => {
  function monta(series: { slug: string; name: string; count?: number }[]) {
    TestBed.configureTestingModule({ imports: [SeriesRail], providers: [provideRouter([])] });
    const f = TestBed.createComponent(SeriesRail); f.componentRef.setInput('series', series); f.componentRef.setInput('title', 'Series de prueba'); f.detectChanges();
    return f.nativeElement as HTMLElement;
  }

  it('una tarjeta por serie, con enlace a su página, tipo y conteo', () => {
    const el = monta([{ slug: 'pk', name: 'PK', count: 11 }, { slug: 'kit-4sr', name: 'KIT 4SR', count: 1 }]);
    const cards = el.querySelectorAll('a.series-card');
    expect(cards.length).toBe(2);
    expect(cards[0].getAttribute('href')).toBe('/serie/pk');
    expect(cards[0].textContent).toContain('Serie PK'); expect(cards[0].textContent).toContain('Bombas de rodete periférico'); expect(cards[0].textContent).toContain('11 modelos');
    expect(cards[1].textContent).toContain('1 modelo ·');
    expect(el.textContent).toContain('Series de prueba');
  });

  it('sin series no pinta nada (ni el título)', () => {
    expect(monta([]).textContent!.trim()).toBe('');
  });

  it('la 2CP usa su hero aprobado del banco', () => {
    const card = monta([{ slug: '2cp', name: '2CP' }]).querySelector('a.series-card')!;
    expect(card.classList.contains('has-hero')).toBe(true);
    expect(card.querySelector('img')!.getAttribute('src')).toContain('media/comercial/');
  });
});
