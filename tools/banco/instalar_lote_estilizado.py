#!/usr/bin/env python3
"""Instala un lote de imágenes comerciales estilizadas por FAMILIA en comerciales/familias/<FAMILIA>/hero/.
Uso: python3 instalar_lote_estilizado.py <zip-o-carpeta> [<zip-o-carpeta> ...]
- Lee manifest_<lote>_estilizado.json (asset_type, status, publicable, reference_slug, notes).
- Nunca sobrescribe: cada asset entra como nueva versión en comerciales/familias/<FAMILIA>/manifest.json
  (si ya existe un hero_stylized, se conserva como versión anterior y se registra la nueva).
- Conserva status/publicable del lote; la aprobación se hace editando manifest.json de la familia.
- Guarda el PNG original intacto y una copia .webp (mismos píxeles, re-codificada) para entrega web."""
import json, os, sys, shutil, zipfile, tempfile, hashlib, datetime, glob
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(HERE, 'comerciales', 'familias')

def instalar(src):
    tmp = None
    if src.lower().endswith('.zip'):
        tmp = tempfile.mkdtemp(); zipfile.ZipFile(src).extractall(tmp); root = tmp
    else: root = src
    mans = glob.glob(os.path.join(root, '**', 'manifest_*estilizado*.json'), recursive=True)
    if not mans: print('sin manifest en', src); return
    man = json.load(open(mans[0], encoding='utf-8')); mroot = os.path.dirname(mans[0]); batch = man.get('batch') or os.path.basename(src)
    for a in man.get('assets', []):
        fam = a['family'].upper(); fdir = os.path.join(BASE, fam); os.makedirs(os.path.join(fdir, 'hero'), exist_ok=True)
        mf = os.path.join(fdir, 'manifest.json')
        fm = json.load(open(mf, encoding='utf-8')) if os.path.exists(mf) else {'familia': fam, 'hero_stylized': {'actual': None, 'versiones': []}}
        srcf = os.path.join(mroot, a['path'])
        if not os.path.exists(srcf): print('  falta archivo', srcf); continue
        sha = hashlib.sha256(open(srcf, 'rb').read()).hexdigest()
        vers = fm['hero_stylized']['versiones']
        if any(v.get('sha256') == sha for v in vers): print(f'  {fam}: ya instalado (mismo sha256), se omite'); continue
        n = len(vers) + 1
        base = f"v{n}__{os.path.splitext(os.path.basename(a['path']))[0]}"
        png = os.path.join(fdir, 'hero', base + '.png'); shutil.copy2(srcf, png)
        webp = os.path.join(fdir, 'hero', base + '.webp'); Image.open(png).convert('RGB').save(webp, 'WEBP', quality=86, method=6)
        v = {'version': n, 'lote': batch, 'asset_type': a.get('asset_type', 'hero_stylized'), 'status': a.get('status', 'revision_required'), 'publicable': bool(a.get('publicable', False)),
             'reference_slug': a.get('reference_slug'), 'notes': a.get('notes'), 'original_png': f'hero/{base}.png', 'web_webp': f'hero/{base}.webp', 'sha256': sha,
             'instalado': datetime.date.today().isoformat(), 'ambito': 'familia (no SKU exacto)'}
        vers.append(v)
        # `actual` solo cambia a una versión publicable; si no hay, apunta a la más reciente para revisión
        pub = [x for x in vers if x['publicable']]
        fm['hero_stylized']['actual'] = (pub[-1] if pub else vers[-1])['version']
        if n > 1: print(f'  {fam}: ya tenía hero_stylized v{n-1}; se registra v{n} sin sobrescribir')
        json.dump(fm, open(mf, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(f'  {fam}: v{n} ← {os.path.basename(a["path"])} [{v["status"]}, publicable={v["publicable"]}]')
    if tmp: shutil.rmtree(tmp)

for s in sys.argv[1:]: print('==', s); instalar(s)
