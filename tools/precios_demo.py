#!/usr/bin/env python3
"""Genera src/app/core/data/precios_demo.json a partir del CSV del catálogo (precio_lista × factor).

SOLO PARA PRESENTACIÓN. Los precios reales llegarán de la API de lista de precios BSV.

Uso:
  python3 tools/precios_demo.py <ruta/pedrollo-catalogo.csv> [--factor 1.15] [--out src/app/core/data/precios_demo.json]
"""
import argparse, csv, json, re, sys, unicodedata
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def model_slug(m: str) -> str:
    """Mismo algoritmo que modelSlug() en src/app/core/resources.ts."""
    s = unicodedata.normalize('NFD', m)
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('csv')
    ap.add_argument('--factor', type=Decimal, default=Decimal('1.15'))
    ap.add_argument('--out', default=str(ROOT / 'src/app/core/data/precios_demo.json'))
    a = ap.parse_args()

    precios: dict[str, float] = {}
    conflictos = []
    with open(a.csv, encoding='utf-8', newline='') as f:
        for r in csv.DictReader(f):
            if r.get('moneda', 'MN') != 'MN' or r.get('activo', 't') != 't':
                continue
            raw = (r.get('precio_lista') or '').strip()
            if not raw:
                continue
            slug = model_slug(r['modelo'])
            precio = float((Decimal(raw) * a.factor).quantize(Decimal('0.01'), ROUND_HALF_UP))
            if slug in precios and precios[slug] != precio:
                conflictos.append((r['modelo'], precios[slug], precio))
            precios[slug] = precio

    # Cruce con el catálogo publicado
    recursos = json.loads((ROOT / 'src/app/core/data/recursos.json').read_text(encoding='utf-8'))
    modelos = [m['modelo'] for fam in recursos['familias'] for s in fam['series'] for m in s['modelos']]
    con_precio = [m for m in modelos if model_slug(m) in precios]
    sin_precio = [m for m in modelos if model_slug(m) not in precios]

    out = {
        '_aviso': f'PRECIOS DE DEMOSTRACIÓN. precio_lista del CSV × {a.factor}. No usar en producción.',
        '_origen': Path(a.csv).name,
        '_factor': str(a.factor),
        'precios': dict(sorted(precios.items())),
    }
    Path(a.out).write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

    print(f'CSV: {len(precios)} modelos con precio (factor {a.factor})')
    print(f'Catálogo: {len(con_precio)}/{len(modelos)} modelos emparejados, {len(sin_precio)} sin precio')
    if conflictos:
        print(f'Conflictos de precio para un mismo slug: {len(conflictos)}', file=sys.stderr)
        for c in conflictos[:10]: print('  ', c, file=sys.stderr)
    if sin_precio:
        print('Sin precio (muestra):', sin_precio[:25])
    print('Escrito:', a.out)

if __name__ == '__main__':
    main()
