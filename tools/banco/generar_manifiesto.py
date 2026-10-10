#!/usr/bin/env python3
"""Manifiesto de recursos visuales por familia, serie y modelo para la tienda.

Dos categorías de recursos:
  1. COMERCIALES por serie (hero cinematográfico, banner, video): carpeta <FAMILIA>/<SERIE>/comercial/.
     Son representativos de la serie, nunca "la foto exacta" de un modelo.
  2. TÉCNICOS: foto oficial de la serie (pedrollo.com.mx), ficha técnica 60 Hz (México), y por modelo
     los datos extraídos de esa ficha (kW, HP, fase, tensión). Nada se inventa: si no está en la ficha, queda null.

Uso:  python3 generar_manifiesto.py [--out <ruta proyecto angular>]
Deja: manifiesto_recursos.json (aquí) y copia recursos a <angular>/public/media + src/app/core/data/recursos.json
"""
import json, os, re, shutil, subprocess, sys, unicodedata, hashlib
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = None
for i, a in enumerate(sys.argv):
    if a == '--out': OUT = sys.argv[i + 1]
if OUT is None:
    OUT = os.path.expanduser('~/Documentos/GrupoEmpresarialBombasVega/websites/bsv-tienda-angular')
OUT = os.path.abspath(OUT)

def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
def carpeta(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return re.sub(r'[^A-Za-z0-9]+', '-', s).strip('-').upper()[:40]

series_crm = json.load(open(os.path.join(HERE, 'familias_crm.json')))
mapeo = json.load(open(os.path.join(HERE, 'mapeo_series.json')))
prods = {p['slug']: p for p in json.load(open(os.path.join(HERE, '_raw', 'productos.json')))}

# ---------------------------------------------------------------- fichas 60 Hz
STOP = {'IE', 'DN', 'HS', 'NPSH', 'H', 'Q', 'P', 'US', 'IMP', 'EN', 'ISO', 'IP', 'IPX', 'M', 'A', 'V', 'HP', 'KW', 'HZ', 'DIN', 'UNI', 'NEMA', 'PN', 'G', 'B', 'C', 'T', 'S', 'N', 'E', 'L', 'MM'}
MODEL_TOKEN = re.compile(r'(?<![A-Za-z0-9])(\d{0,3}[A-Z]{1,10}m?)\s?([0-9/][0-9A-Za-z./]*(?:-[0-9A-Za-z]+)*)(?:\s?-\s?([A-Z]))?(?![A-Za-z0-9/])')
NUM_PAIR = re.compile(r'(?<![0-9.])(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)(?![0-9.])')
VOLT_RE = re.compile(r'(\d{3})\s*V\b')
AMP_RE = re.compile(r'(\d+(?:\.\d+)?)\s*[Aa]\b')

def tokens(line):
    out = []
    for m in MODEL_TOKEN.finditer(line):
        pre, body, suf = m.group(1), m.group(2), m.group(3)
        if pre.rstrip('m').upper() in STOP or len(pre.rstrip('m')) < 2 and not pre[0].isdigit(): continue
        if body.endswith('.'): body = body[:-1]
        name = f"{pre} {body}" + (f" - {suf}" if suf else '')
        out.append((name, pre.endswith('m'), m.start()))
    return out

def parse_ficha(pdf):
    """{modelo: {kw, hp, fase, tensiones}} leyendo tablas de prestaciones (kW/HP) y de consumos (tensiones)."""
    try:
        txt = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True, timeout=60).stdout
    except Exception:
        return {}
    out, fase_hdr, volt_mono, volt_tri = {}, None, [], []
    for line in txt.splitlines():
        low = line.lower()
        if 'monof' in low and 'trif' in low: fase_hdr = 'ambas'
        elif 'monof' in low: fase_hdr = 'Monofásica'
        elif 'trif' in low: fase_hdr = 'Trifásica'
        # cabecera de tensiones (línea con voltajes y sin amperajes)
        if VOLT_RE.search(line) and not AMP_RE.search(line):
            if 'trif' in low and 'monof' in low:
                i = low.index('trif'); volt_mono = sorted(set(VOLT_RE.findall(line[:i])), key=int); volt_tri = sorted(set(VOLT_RE.findall(line[i:])), key=int)
            elif 'trif' in low: volt_tri = sorted(set(VOLT_RE.findall(line)), key=int)
            elif 'monof' in low: volt_mono = sorted(set(VOLT_RE.findall(line)), key=int)
        toks = tokens(line)
        if not toks: continue
        rest = line[max(t[2] for t in toks):]
        rest = rest[rest.index(toks[-1][0].split(' ')[0]) if toks[-1][0].split(' ')[0] in rest else 0:]
        # pares kW / HP después del último modelo
        after = line[toks[-1][2] + len(toks[-1][0]):]
        pair = None
        nums = [float(x) for x in re.findall(r'(?<![0-9A-Za-z.])(\d+(?:\.\d+)?)(?![0-9A-Za-z.])', after)] if not AMP_RE.search(after) else []
        for a, b in zip(nums, nums[1:]):
            if 0.1 <= a <= 40 and 0.2 <= b <= 60 and 1.15 <= b / a <= 1.6: pair = (a, b); break
        if pair:
            for name, mono, _ in toks:
                f = 'Monofásica' if mono else ('Trifásica' if (len(toks) > 1 or fase_hdr in ('Trifásica', 'ambas')) else fase_hdr)
                out.setdefault(name, {'kw': pair[0], 'hp': pair[1], 'fase': f, 'tensiones': []})
            continue
        # fila de consumos: cada modelo seguido de amperajes
        if AMP_RE.search(line):
            for name, mono, _ in toks:
                if name in out and not out[name]['tensiones']:
                    v = volt_mono if mono else volt_tri
                    if not v: v = volt_mono or volt_tri
                    out[name]['tensiones'] = [x + ' V' for x in v]
    if os.environ.get('DEBUG_FICHA') and os.environ['DEBUG_FICHA'] in pdf:
        print('DEBUG', pdf, {k: v for k, v in list(out.items())[:4]}, 'mono', volt_mono, 'tri', volt_tri)
    return out

def norm_model(m):
    return re.sub(r'[\s\-]+', '', m).upper()
def norm_keys(m):
    k = norm_model(m); ks = {k}
    if k.endswith(('S', 'N')) and '/' in k: ks.add(k[:-1])
    return ks


# ---------------------------------------------------------------- paquetes técnicos por serie (recortes fieles del PDF)
import csv, glob
def cargar_paquete_tecnico(serie_dir, fam_slug, ser_slug):
    """Lee <serie>/tecnico/data/manifest_*.json y models_*.csv (columna estado). Copia los recortes tal cual.
    Devuelve (compartidos, por_modelo, meta) con rutas públicas; estado 'pendiente aprobacion' se conserva para que la tienda no lo publique."""
    tdir = os.path.join(serie_dir, 'tecnico')
    mans = glob.glob(os.path.join(tdir, 'data', 'manifest_*.json'))
    if not mans: return {}, {}, None
    man = json.load(open(mans[0], encoding='utf-8'))
    estados = {}
    for c in glob.glob(os.path.join(tdir, 'data', 'models_*.csv')):
        with open(c, encoding='utf-8-sig') as fh:
            for row in csv.DictReader(fh): estados[row['modelo'].strip()] = (row.get('estado') or '').strip().lower()
    def pub(rel):
        if not rel: return None
        src = os.path.join(tdir, rel)
        if not os.path.exists(src): return None
        out_rel = f'media/tecnico/{fam_slug}/{ser_slug}/{rel}'
        dst = os.path.join(OUT, 'public', out_rel); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(src, dst)
        return out_rel
    compartidos = {k: {'path': pub(v.get('path')), 'pdf_page': v.get('pdf_page')} for k, v in (man.get('shared_technical') or {}).items()}
    por_modelo = {}
    for modelo, m in (man.get('models') or {}).items():
        est = estados.get(modelo, 'sin estado')
        por_modelo[modelo] = {
            'kw': m.get('power_kw'), 'hp': m.get('power_hp'),
            'curva': pub(m.get('curve_image')), 'tabla_prestaciones': pub(m.get('performance_table_image')), 'tabla_consumos': pub(m.get('electrical_table_image')),
            'pdf_pagina_curva': m.get('pdf_curve_page'), 'foto_modelo': pub(m.get('catalog_image')), 'foto_modelo_verificada': bool(m.get('exact_model_image_verified')),
            'estado': est, 'aprobado': est == 'aprobado',
        }
    meta = {'fuente': pub(man.get('source')), 'frecuencia_hz': man.get('frequency_hz'), 'calidad': man.get('quality_status'), 'notas': man.get('notes', []),
            'foto_referencial': pub((man.get('commercial_images') or {}).get('original')), 'alcance_foto': (man.get('commercial_images') or {}).get('scope'),
            'readme': pub('README.txt')}
    return compartidos, por_modelo, meta


# ---------------------------------------------------------------- lote global de revisión (vistas preliminares por página de PDF)
LOTE_DIR = os.path.join(HERE, '_lotes', 'revision_global_60hz')
def cargar_lote_revision():
    """manifest_revision_global.json: por slug de pedrollo.com.mx, primera página de prestaciones y página de componentes
    detectadas (páginas completas del PDF, sin modificar). Todo queda pendiente; nada se publica."""
    f = os.path.join(LOTE_DIR, 'manifest_revision_global.json')
    if not os.path.exists(f): return {}, {}
    man = json.load(open(f, encoding='utf-8'))
    out = {}
    for pr in man.get('productos', []):
        out[pr['slug']] = pr
    return out, man

LOTE, LOTE_MAN = cargar_lote_revision()

def revision_de_slug(sl, fam_slug, ser_slug):
    pr = LOTE.get(sl)
    if not pr: return None
    def pub(rel):
        if not rel: return None
        src = os.path.join(LOTE_DIR, rel)
        if not os.path.exists(src): return None
        out_rel = f'media/revision/{fam_slug}/{ser_slug}/{sl}/{os.path.basename(rel)}'
        dst = os.path.join(OUT, 'public', out_rel); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(src, dst)
        return out_rel
    # verificación del PDF del banco contra el sha256 del lote
    local = (pr.get('pdf_60hz_zip') or '').replace('pedrollo/', '', 1)
    sha_ok = None
    if local and os.path.exists(os.path.join(HERE, local)):
        sha_ok = hashlib.sha256(open(os.path.join(HERE, local), 'rb').read()).hexdigest() == pr.get('pdf_sha256')
    return {
        'slug': sl, 'nombre': pr.get('nombre'), 'pdf_60hz': os.path.basename(pr.get('pdf_60hz_zip') or '') or None, 'pdf_sha256_coincide': sha_ok,
        'pagina_prestaciones': pr.get('pagina_prestaciones') or None, 'pagina_componentes': pr.get('pagina_componentes') or None,
        'preview_prestaciones': pub(pr.get('preview_prestaciones')), 'preview_componentes': pub(pr.get('preview_componentes')),
        'estado_tecnico': pr.get('estado_tecnico'), 'estado_comercial': pr.get('estado_comercial'),
        'imagen_modelo_verificada': bool(pr.get('imagen_modelo_verificada')), 'publicable': bool(pr.get('publicable')),
        'observaciones': (pr.get('observaciones') or '').strip('; ').strip(),
        'advertencia': 'Vista preliminar de revisión: primera página detectada en el PDF, no es la curva específica de cada modelo.',
    }


# ---------------------------------------------------------------- paquetes multimedia comerciales por serie (derivados fieles de la foto de familia)
def cargar_multimedia(serie_dir, fam_slug, ser_slug):
    """<SERIE>/comercial/<paquete>/manifest_*_multimedia_*.json → catálogo 1:1 y detalles macro, derivados sin IA de la foto de
    referencia de familia. Nunca se marcan como foto verificada de un modelo. `status` manda la publicación."""
    out = []
    for mf in sorted(glob.glob(os.path.join(serie_dir, 'comercial', '*', 'manifest_*multimedia*.json'))):
        pk_dir = os.path.dirname(mf); man = json.load(open(mf, encoding='utf-8')); pk_name = os.path.basename(pk_dir)
        def pub(rel):
            src = os.path.join(pk_dir, rel)
            if not os.path.exists(src): return None
            out_rel = f'media/comercial/{fam_slug}/{ser_slug}/{pk_name}/{rel}'
            dst = os.path.join(OUT, 'public', out_rel); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(src, dst)
            return out_rel
        status = (man.get('status') or '').lower()
        assets = []
        for a in man.get('assets', []):
            path = pub(a['path'])
            if not path: continue
            assets.append({'path': path, 'tipo': a.get('type'), 'derivacion': a.get('derivation'), 'verificada_modelo': bool(a.get('exact_model_image_verified')),
                           'etiqueta': {'carcasa_frontal': 'Carcasa frontal', 'motor_aletas': 'Motor y aletas de ventilación', 'descarga_superior': 'Boca de descarga', 'caja_conexiones': 'Caja de conexiones'}.get(re.sub(r'^.*macro_|\.\w+$', '', os.path.basename(a['path'])), os.path.splitext(os.path.basename(a['path']))[0])})
        out.append({'paquete': pk_name, 'status': status, 'aprobado': status in ('aprobado', 'approved'), 'fuente': man.get('source_image'), 'tipo_fuente': man.get('source_image_type'),
                    'catalogo': [x for x in assets if x['tipo'] == 'catalog'], 'macro': [x for x in assets if x['tipo'] == 'macro'], 'otros': [x for x in assets if x['tipo'] not in ('catalog', 'macro')],
                    'escena_instalada': man.get('installed_scene'), 'hero': man.get('commercial_hero'), 'nota': man.get('note'), 'readme': pub('README.md')})
    return out


# ---------------------------------------------------------------- recursos comerciales por FAMILIA (hero estilizado, banners)
FAM_COM_DIR = os.path.join(HERE, 'comerciales', 'familias')
def comercial_de_familia(fam_carpeta, fam_slug):
    """comerciales/familias/<FAMILIA>/manifest.json → hero_stylized con versiones. Se copia la copia web (.webp) y el original.
    publicable=False ⇒ la tienda solo lo muestra en modo revisión."""
    mf = os.path.join(FAM_COM_DIR, fam_carpeta, 'manifest.json')
    if not os.path.exists(mf): return None
    fm = json.load(open(mf, encoding='utf-8'))
    def pub(rel):
        src = os.path.join(FAM_COM_DIR, fam_carpeta, rel)
        if not os.path.exists(src): return None
        out_rel = f'media/comerciales/familias/{fam_slug}/{rel}'
        dst = os.path.join(OUT, 'public', out_rel); os.makedirs(os.path.dirname(dst), exist_ok=True)
        if not os.path.exists(dst) or os.path.getsize(dst) != os.path.getsize(src): shutil.copy2(src, dst)
        return out_rel
    hs = fm.get('hero_stylized') or {}
    versiones = []
    for v in hs.get('versiones', []):
        versiones.append({**v, 'web': pub(v['web_webp']), 'original': pub(v['original_png'])})
    actual = next((v for v in versiones if v['version'] == hs.get('actual')), None)
    return {'hero_stylized': {'actual': actual, 'versiones': versiones, 'aprobado': bool(actual and actual['publicable'] and actual['status'] in ('aprobado', 'approved'))}}

# ---------------------------------------------------------------- manifiesto
manifest = {'_generado_por': 'generar_manifiesto.py', '_frecuencia': '60 Hz (México)', 'familias': []}
fam_index = {}
for s in series_crm:
    fam_slug = slug(s['familia'])
    fam = fam_index.get(fam_slug)
    if not fam:
        fam = {'slug': fam_slug, 'nombre': s['familia'], 'series': [], 'comercial': comercial_de_familia(carpeta(s['familia']), fam_slug)}
        fam_index[fam_slug] = fam; manifest['familias'].append(fam)
    ser_slug = slug(s['serie'])
    serie_dir = os.path.join(HERE, carpeta(s['familia']), carpeta(s['serie']))
    slugs = mapeo.get(f"{s['familia']}|{s['serie']}", [])

    # --- comerciales (representativos de la serie)
    com_dir = os.path.join(serie_dir, 'comercial')
    comercial = {'representativo': True, 'hero': None, 'banner': None, 'video': None, 'galeria': []}
    if os.path.isdir(com_dir):
        for f in sorted(os.listdir(com_dir)):
            if os.path.isdir(os.path.join(com_dir, f)): continue  # paquetes multimedia: ver cargar_multimedia
            rel = f'media/comercial/{fam_slug}/{ser_slug}/{f}'
            base = f.lower()
            if base.startswith('hero'): comercial['hero'] = rel
            elif base.startswith('banner'): comercial['banner'] = rel
            elif base.endswith(('.mp4', '.webm')): comercial['video'] = rel
            else: comercial['galeria'].append(rel)
            dst = os.path.join(OUT, 'public', rel); os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(com_dir, f), dst)
    comercial['multimedia'] = cargar_multimedia(serie_dir, fam_slug, ser_slug)
    # --- técnicos (oficiales de pedrollo.com.mx)
    tecnico = {'foto_oficial': None, 'foto_oficial_fuente': None, 'ficha_60hz': None, 'otros_pdf': [], 'galeria': []}
    fichas = {}
    for sl in slugs:
        p = prods.get(sl)
        if not p: continue
        img = os.path.join(serie_dir, p.get('image_file') or '')
        if p.get('image_file') and os.path.exists(img) and not tecnico['foto_oficial']:
            rel = f'media/catalogo/{fam_slug}/{ser_slug}/{p["image_file"]}'
            dst = os.path.join(OUT, 'public', rel); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(img, dst)
            tecnico['foto_oficial'] = rel; tecnico['foto_oficial_fuente'] = p['link']
        elif p.get('image_file') and os.path.exists(img):
            rel = f'media/catalogo/{fam_slug}/{ser_slug}/{p["image_file"]}'
            dst = os.path.join(OUT, 'public', rel); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(img, dst)
            tecnico['galeria'].append(rel)
        pdf_dir = os.path.join(serie_dir, sl)
        if os.path.isdir(pdf_dir):
            for f in sorted(os.listdir(pdf_dir)):
                if '50Hz' in f or '50HZ' in f: continue
                rel = f'media/fichas/{fam_slug}/{ser_slug}/{f}'
                dst = os.path.join(OUT, 'public', rel); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(os.path.join(pdf_dir, f), dst)
                if '60Hz' in f and ('ficha' in f.lower() or not tecnico['ficha_60hz']):
                    if not tecnico['ficha_60hz'] or 'ficha' in f.lower(): tecnico['ficha_60hz'] = rel
                    fichas.update(parse_ficha(os.path.join(pdf_dir, f)))
                else: tecnico['otros_pdf'].append(rel)
                if '60Hz' in f and 'ficha' not in f.lower():
                    fichas.update({k: v for k, v in parse_ficha(os.path.join(pdf_dir, f)).items() if k not in fichas})
    # --- paquete técnico (recortes fieles) si existe para la serie
    rec_compartidos, rec_modelos, rec_meta = cargar_paquete_tecnico(serie_dir, fam_slug, ser_slug)
    tecnico['recortes'] = {'compartidos': rec_compartidos, 'meta': rec_meta}
    # --- lote global de revisión: vistas preliminares por página de pedrollo.com.mx (una por slug)
    tecnico['revision'] = [r for r in (revision_de_slug(sl, fam_slug, ser_slug) for sl in slugs) if r]
    # --- modelos: los del CRM (ejemplos) validados contra la ficha
    norm_fichas = {}
    for k, v in fichas.items():
        for nk in norm_keys(k): norm_fichas.setdefault(nk, (k, v))
    modelos = []
    for ej in s['ejemplos']:
        hit = None
        for nk in norm_keys(ej):
            hit = norm_fichas.get(nk)
            if hit: break
        m = {'modelo': ej, 'en_crm': True, 'validado': bool(hit), 'kw': None, 'hp': None, 'fase': None, 'tensiones': [],
             'catalog': tecnico['foto_oficial'], 'catalog_es_foto_de_serie': True,
             'hero': comercial['hero'], 'gallery': [x for x in [comercial['hero'], comercial['banner']] + comercial['galeria'] if x],
             'technical': tecnico['ficha_60hz'], 'video': comercial['video'],
             'placeholder': {'catalog': tecnico['foto_oficial'] is None, 'hero': comercial['hero'] is None, 'technical': tecnico['ficha_60hz'] is None, 'video': comercial['video'] is None}}
        if hit:
            _, v = hit; m.update({'kw': v['kw'], 'hp': v['hp'], 'fase': v['fase'], 'tensiones': v['tensiones']})
        else:
            m['nota'] = 'Modelo del CRM no localizado en la ficha 60 Hz del banco; especificaciones pendientes.' if fichas else 'Sin ficha 60 Hz en el banco.'
        rec = next((v for k, v in rec_modelos.items() if norm_keys(k) & norm_keys(ej)), None)
        m['recortes'] = rec
        if rec and rec['kw'] is not None and m['kw'] is not None and (rec['kw'] != m['kw'] or rec['hp'] != m['hp']):
            m['nota'] = f"Discrepancia kW/HP entre parser ({m['kw']}/{m['hp']}) y paquete técnico ({rec['kw']}/{rec['hp']}); revisar."
        modelos.append(m)
    # modelos que solo están en el paquete técnico (ficha 60 Hz) y no en los ejemplos del CRM
    vistos = {nk for mm in modelos for nk in norm_keys(mm['modelo'])}
    for modelo, rec in rec_modelos.items():
        if norm_keys(modelo) & vistos: continue
        hit = next((norm_fichas[nk] for nk in norm_keys(modelo) if nk in norm_fichas), None)
        m = {'modelo': modelo, 'en_crm': False, 'validado': bool(hit), 'kw': rec['kw'], 'hp': rec['hp'], 'fase': hit[1]['fase'] if hit else None, 'tensiones': hit[1]['tensiones'] if hit else [],
             'catalog': tecnico['foto_oficial'], 'catalog_es_foto_de_serie': True, 'hero': comercial['hero'],
             'gallery': [x for x in [comercial['hero'], comercial['banner']] + comercial['galeria'] if x], 'technical': tecnico['ficha_60hz'], 'video': comercial['video'],
             'placeholder': {'catalog': tecnico['foto_oficial'] is None, 'hero': comercial['hero'] is None, 'technical': tecnico['ficha_60hz'] is None, 'video': comercial['video'] is None},
             'recortes': rec, 'nota': 'Modelo de la ficha 60 Hz no listado en los ejemplos del CRM; confirmar en lista BSV.'}
        modelos.append(m)
    manifest_serie = {'slug': ser_slug, 'serie': s['serie'], 'n_productos_crm': s['n'], 'paginas_pedrollo': slugs,
                      'comercial': comercial, 'tecnico': tecnico, 'modelos': modelos,
                      'modelos_en_ficha_60hz': sorted(fichas.keys())}
    fam['series'].append(manifest_serie)

json.dump(manifest, open(os.path.join(HERE, 'manifiesto_recursos.json'), 'w'), ensure_ascii=False, indent=1)
dst = os.path.join(OUT, 'src', 'app', 'core', 'data', 'recursos.json'); os.makedirs(os.path.dirname(dst), exist_ok=True)
json.dump(manifest, open(dst, 'w'), ensure_ascii=False)

# ---------------------------------------------------------------- reporte
tot = val = sin_ficha = sin_foto = 0
lines = ['# Validación modelo ↔ ficha 60 Hz', '', '| Familia | Serie | Modelo (CRM) | kW | HP | Fase | Tensión | Estado |', '|---|---|---|---|---|---|---|---|']
for fam in manifest['familias']:
    for se in fam['series']:
        if not se['tecnico']['foto_oficial']: sin_foto += 1
        if not se['tecnico']['ficha_60hz']: sin_ficha += 1
        for m in se['modelos']:
            tot += 1; val += m['validado']
            est = '✓ validado' if m['validado'] else ('sin ficha 60 Hz' if not se['tecnico']['ficha_60hz'] else 'no está en la ficha')
            if m.get('recortes'): est += f" · recortes: {m['recortes']['estado']}"
            if not m.get('en_crm', True): est += ' · no en ejemplos CRM'
            lines.append(f"| {fam['nombre']} | {se['serie']} | {m['modelo']} | {m['kw'] or ''} | {m['hp'] or ''} | {m['fase'] or ''} | {', '.join(m['tensiones'])} | {est} |")
lines.insert(2, f"Modelos CRM revisados: {tot} · validados contra ficha: {val} · series sin ficha 60 Hz: {sin_ficha} · series sin foto oficial: {sin_foto}\n")
open(os.path.join(HERE, 'VALIDACION.md'), 'w').write('\n'.join(lines) + '\n')
# ---------------------------------------------------------------- reporte del lote de revisión
if LOTE:
    fam_rows, sin_constr, pendientes = [], [], []
    series_por_slug = {}
    for fam in manifest['familias']:
        for se in fam['series']:
            for sl in se['paginas_pedrollo']: series_por_slug.setdefault(sl, []).append((fam['nombre'], se['serie']))
    fam_stats = {}
    for sl, pr in LOTE.items():
        fams = series_por_slug.get(sl, [])
        key = fams[0][0] if fams else '— sin serie CRM —'
        st = fam_stats.setdefault(key, {'productos': 0, 'pdf': 0, 'prest': 0, 'comp': 0, 'completos': 0})
        st['productos'] += 1; st['pdf'] += bool(pr.get('pdf_60hz_zip')); st['prest'] += bool(pr.get('pagina_prestaciones')); st['comp'] += bool(pr.get('pagina_componentes'))
        st['completos'] += bool(pr.get('pdf_60hz_zip') and pr.get('pagina_prestaciones') and pr.get('pagina_componentes'))
        if not pr.get('pagina_componentes'): sin_constr.append((sl, pr.get('nombre'), os.path.basename(pr.get('pdf_60hz_zip') or '') or 'sin PDF', ', '.join(f"{a} / {b}" for a, b in fams) or '—'))
        motivos = []
        if not pr.get('pdf_60hz_zip'): motivos.append('sin PDF 60 Hz')
        if not pr.get('pagina_prestaciones'): motivos.append('sin página de prestaciones')
        if not fams: motivos.append('slug sin serie en el CRM')
        if len(fams) > 1: motivos.append(f'slug compartido por {len(fams)} series: ' + ', '.join(b for _, b in fams))
        if motivos: pendientes.append((sl, pr.get('nombre'), '; '.join(motivos)))
    L = ['# Reporte del lote global de revisión · México 60 Hz', '', f"Productos en el lote: {len(LOTE)} · todos con estado técnico `pendiente_revision`, comercial `sin_verificar`, `publicable = false`. Nada se publica; los previews se ven solo en modo revisión (`?revision=1`).", '',
         '## 1. Familias listas para revisión', '', 'Lista = PDF 60 Hz presente, sha256 verificado y ambas páginas (prestaciones + componentes) detectadas para todos sus productos.', '',
         '| Familia | Productos | Con PDF | Con prestaciones | Con componentes | Completos | Estado |', '|---|---|---|---|---|---|---|']
    for k, st in sorted(fam_stats.items()):
        estado = 'Lista para revisión' if st['completos'] == st['productos'] else ('Parcial' if st['completos'] else 'Sin previews completos')
        L.append(f"| {k} | {st['productos']} | {st['pdf']} | {st['prest']} | {st['comp']} | {st['completos']} | {estado} |")
    L += ['', '## 2. Documentos sin sección constructiva detectada', '', 'El detector no halló una página de características constructivas; no implica que el PDF no la tenga. Revisar manualmente.', '', '| Slug | Producto | PDF | Serie(s) CRM |', '|---|---|---|---|']
    L += [f"| {a} | {b} | {c} | {d} |" for a, b, c, d in sorted(sin_constr)]
    L += ['', '## 3. Productos con asociaciones pendientes', '', '| Slug | Producto | Pendiente |', '|---|---|---|']
    L += [f"| {a} | {b} | {c} |" for a, b, c in sorted(pendientes)]
    L += ['', '## 4. Recordatorios del lote', ''] + [f"- {w}" for w in LOTE_MAN.get('advertencias', [])]
    open(os.path.join(HERE, 'REPORTE_REVISION.md'), 'w').write('\n'.join(L) + '\n')
    print(f"lote de revisión: {len(LOTE)} productos · familias: {len(fam_stats)} · sin sección constructiva: {len(sin_constr)} · con pendientes: {len(pendientes)}")

print(f'modelos: {tot} validados: {val} | series sin ficha: {sin_ficha} sin foto: {sin_foto} | salida: {OUT}')
