#!/usr/bin/env python3
"""
Instala imágenes de las páginas de serie. El contrato es `tools/series/datos/series-e-imagenes.csv` (96 series, 500 huecos): cada archivo
se llama EXACTAMENTE como su hueco (`serie-pk-hero.webp`, `curva-pk.png`, `detalle-2cp-usos.webp`).

  python3 tools/series/instalar_lote_series.py <carpeta|zip> [...]            revisa el lote y lo deja en tools/series/pendientes/ (no se publica)
  python3 tools/series/instalar_lote_series.py <carpeta|zip> --aprobar        lo instala en public/media/series/<slug>/ y lo enciende en la tienda
  python3 tools/series/instalar_lote_series.py --faltantes                    cuántos huecos faltan por serie

Reglas: un nombre que no esté en el contrato se rechaza; nada se sobrescribe sin `--reemplazar`; un hueco que ya resuelve el manifiesto del
banco (hoy `serie-2cp-hero`) no se toca; las composiciones se guardan en WebP (mismos píxeles) y las curvas y cortes técnicos en PNG.
Cada instalación queda en `tools/series/instalados.json` con su sha256 y fecha. La tienda lee `src/app/core/data/series-media.json`.
"""
import csv, datetime, hashlib, json, os, shutil, sys, tempfile, zipfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
INDICE = os.path.join(ROOT, 'src', 'app', 'core', 'data', 'series-media.json'); REGISTRO = os.path.join(HERE, 'instalados.json')
PUBLICO = os.path.join(ROOT, 'public', 'media', 'series'); PENDIENTES = os.path.join(HERE, 'pendientes')
EXT = {'.webp', '.png', '.jpg', '.jpeg'}; MIN_HERO, MIN_OTRO = 1920, 1200


def contrato():
    out = {}
    for r in csv.DictReader(open(os.path.join(HERE, 'datos', 'series-e-imagenes.csv'), encoding='utf-8-sig')):
        for h in r['huecos'].split(' | '): out[h.strip()] = r['slug']
    return out


def del_banco():
    rec = json.load(open(os.path.join(ROOT, 'src', 'app', 'core', 'data', 'recursos.json'), encoding='utf-8'))
    return {f"serie-{s['slug']}-hero" for f in rec['familias'] for s in f['series'] if s['comercial'].get('hero')}


def lee(p, defecto): return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else defecto
def escribe(p, d): json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, sort_keys=True); open(p, 'a').write('\n')


def archivos(src, tmp):
    if src.lower().endswith('.zip'):
        d = tempfile.mkdtemp(dir=tmp)
        with zipfile.ZipFile(src) as z:
            for m in z.infolist():                      # solo el nombre base: un zip no escribe fuera de su carpeta
                n = os.path.basename(m.filename)
                if m.is_dir() or not n or n.startswith('.') or os.path.splitext(n)[1].lower() not in EXT: continue
                with z.open(m) as f, open(os.path.join(d, n), 'wb') as o: shutil.copyfileobj(f, o)
        src = d
    for base, _, fs in os.walk(src):
        for n in sorted(fs):
            if not n.startswith('.') and os.path.splitext(n)[1].lower() in EXT: yield os.path.join(base, n)


def instala(fuentes, aprobar, reemplazar):
    huecos = contrato(); banco = del_banco(); indice = lee(INDICE, {}); reg = lee(REGISTRO, {}); hoy = datetime.date.today().isoformat()
    ok = rech = 0
    with tempfile.TemporaryDirectory() as tmp:
        for src in fuentes:
            for f in archivos(src, tmp):
                hueco, ext = os.path.splitext(os.path.basename(f)); slug = huecos.get(hueco)
                def no(m):
                    nonlocal rech; rech += 1; print(f'  RECHAZADO {os.path.basename(f)}: {m}')
                if not slug: no('el nombre no es un hueco del contrato'); continue
                if hueco in banco: no('ese hueco ya lo resuelve el manifiesto del banco (recurso aprobado)'); continue
                try:
                    im = Image.open(f); im.load(); w, h = im.size
                except Exception as e: no(f'no es una imagen legible ({e})'); continue
                minimo = MIN_HERO if hueco.endswith('-hero') else MIN_OTRO
                if w < minimo: no(f'mide {w}×{h}; el ancho mínimo es {minimo}px'); continue
                if w <= h and not hueco.startswith(('curva-', 'tile-')): no(f'mide {w}×{h}; debe ser horizontal'); continue
                tecnica = hueco.startswith(('curva-', 'tile-')); sal = '.png' if tecnica else '.webp'
                destino = os.path.join(PUBLICO if aprobar else PENDIENTES, slug, hueco + sal)
                if aprobar and hueco in indice and not reemplazar: no('ya está instalado; usa --reemplazar para cambiarlo'); continue
                os.makedirs(os.path.dirname(destino), exist_ok=True)
                if tecnica: im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB').save(destino, 'PNG', optimize=True)
                else: im.convert('RGB').save(destino, 'WEBP', quality=86, method=6)
                sha = hashlib.sha256(open(f, 'rb').read()).hexdigest()
                reg[hueco] = {'slug': slug, 'origen': os.path.basename(f), 'sha256': sha, 'medidas': f'{w}x{h}', 'estado': 'aprobado' if aprobar else 'pendiente', 'fecha': hoy}
                if aprobar: indice[hueco] = f'media/series/{slug}/{hueco}{sal}'
                ok += 1; print(f"  {'INSTALADO' if aprobar else 'PENDIENTE'} {hueco} ({w}×{h}) → {os.path.relpath(destino, ROOT)}")
    escribe(REGISTRO, reg)
    if aprobar: escribe(INDICE, indice)
    print(f"{ok} {'instalados' if aprobar else 'revisados y en pendientes'}, {rech} rechazados. En la tienda: {len(indice)} de {len(huecos)} huecos.")
    return 1 if rech else 0


def faltantes():
    huecos = contrato(); indice = lee(INDICE, {}); banco = del_banco(); por = {}
    for h, s in huecos.items(): por.setdefault(s, [0, 0]); por[s][1] += 1; por[s][0] += 1 if (h in indice or h in banco) else 0
    for s, (a, b) in sorted(por.items()): print(f'{s:24} {a}/{b}' + ('' if a < b else '  completa'))
    print(f'Total: {sum(a for a, _ in por.values())} de {len(huecos)} huecos con imagen.')


if __name__ == '__main__':
    args = sys.argv[1:]
    if '--faltantes' in args: faltantes(); sys.exit(0)
    fuentes = [a for a in args if not a.startswith('--')]
    if not fuentes: print(__doc__); sys.exit(2)
    sys.exit(instala(fuentes, '--aprobar' in args, '--reemplazar' in args))
