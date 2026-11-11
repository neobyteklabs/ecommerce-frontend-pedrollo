#!/usr/bin/env python3
"""
Monta el hero de una serie: fotografía ORIGINAL del banco (fondo blanco) sobre un fondo vacío de `tools/series/fondos/`.

El producto no pasa por ningún generador: sus píxeles se copian de la foto original. El recorte avanza desde las orillas de la imagen
hacia adentro (relleno por contigüidad), así que un brillo o una zona clara DENTRO del equipo nunca se confunde con fondo. La sombra
gris que la foto trae sobre el blanco se convierte en sombra real sobre el piso nuevo, solo en la franja inferior del equipo.

  python3 tools/series/montar_heroes.py 4sr f mk            monta esas series en tools/series/montajes/
  python3 tools/series/montar_heroes.py --todas             todas las series con foto oficial y sin hero aprobado

Encuadre fijo (2560×1440): equipo dentro de x 205–1400, apoyado en y = BASE; mitad derecha libre para el texto.
Después: `python3 tools/series/instalar_lote_series.py tools/series/montajes` (revisión) y `--aprobar` cuando se vean bien.
"""
import hashlib, json, os, sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
FONDOS = os.path.join(HERE, 'fondos'); SALIDA = os.path.join(HERE, 'montajes')
W, H = 2560, 1440
X0, X1 = 205, 1400            # el equipo completo va aquí
BASE = 1030                   # y donde apoya el equipo (el horizonte del piso está en ~860)
ALTO_MAX, ANCHO_MAX = 800, 1100
BLANCO, CLARO, NEUTRO = 244, 150, 12   # fondo seguro · sombra candidata (mínimo de canal) · máx−mín de canales
BORDE = 9                              # contraste local que cuenta como contorno del equipo: la sombra no lo cruza
# Ajustes por serie cuando la regla general no alcance (se documenta aquí, no se retoca a mano).
AJUSTES = {}


def umbral(img_l, t): return img_l.point(lambda v: 255 if v >= t else 0)


def contiguo_al_borde(cand):
    """De una máscara L (255 = candidato) deja solo lo conectado con la orilla de la imagen."""
    w, h = cand.size; m = Image.new('L', (w + 2, h + 2), 255); m.paste(cand, (1, 1))
    ImageDraw.floodfill(m, (0, 0), 128, thresh=0)
    return m.crop((1, 1, w + 1, h + 1)).point(lambda v: 255 if v == 128 else 0)


def mascaras(src, cfg):
    """Devuelve (alfa del producto, alfa de la sombra) al tamaño de `src`. Se calcula a media resolución y se amplía."""
    w, h = src.size; chico = src.resize((w // 2, h // 2), Image.LANCZOS); r, g, b = chico.split()
    mn = ImageChops.darker(ImageChops.darker(r, g), b); mx = ImageChops.lighter(ImageChops.lighter(r, g), b)
    neutro = ImageChops.subtract(mx, mn).point(lambda v: 255 if v <= cfg.get('neutro', NEUTRO) else 0)
    fondo = contiguo_al_borde(umbral(mn, cfg.get('blanco', BLANCO)))                       # blanco puro que toca la orilla
    caja = ImageChops.invert(fondo).getbbox()                                              # el equipo (con su sombra)
    cand = ImageChops.multiply(umbral(mn, cfg.get('claro', CLARO)), neutro)                # gris claro y sin color
    # Barrera: la sombra es un degradado suave; el contorno del equipo no. Sin esto, un cuerpo blanco o gris (TOP, STEADYPRES)
    # se confundía con sombra y el recorte se lo comía.
    contorno = chico.convert('L').filter(ImageFilter.GaussianBlur(0.8)).filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v >= cfg.get('borde', BORDE) else 0).filter(ImageFilter.MaxFilter(3))
    libre = cand
    cand = ImageChops.multiply(cand, ImageChops.invert(contorno))
    franja = Image.new('L', chico.size, 0)                                                 # la sombra solo existe abajo
    corte = caja[1] + int((caja[3] - caja[1]) * cfg.get('franja', 0.62))
    franja.paste(255, (0, corte, chico.size[0], chico.size[1]))
    cand = ImageChops.multiply(cand, franja)
    region = contiguo_al_borde(ImageChops.lighter(fondo, cand))
    # La barrera deja un filo claro de 2–3 px pegado al equipo: se recupera solo lo que es gris claro y toca lo ya quitado.
    region = ImageChops.lighter(region, ImageChops.multiply(libre, region.filter(ImageFilter.MaxFilter(7))))
    sombra = ImageChops.subtract(region, fondo)
    prod = ImageChops.invert(region).filter(ImageFilter.MinFilter(3))                      # 1 px adentro: sin filo blanco
    # Motas sueltas de sombra que quedaron como «equipo»: se conserva solo lo que está junto a una masa real del producto.
    masa = prod.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7))
    prod = ImageChops.multiply(prod, masa.filter(ImageFilter.MaxFilter(15)))
    lum = chico.convert('L')
    sombra_a = ImageChops.multiply(sombra, ImageChops.invert(lum).point(lambda v: min(255, int(v * 3.2))))
    arriba = lambda m, blur: m.resize((w, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(blur))
    return arriba(prod, 1.4), arriba(sombra_a, 6)


def monta(slug, foto, fondo, cfg):
    src = Image.open(foto).convert('RGB'); a_prod, a_somb = mascaras(src, cfg)
    caja = a_prod.point(lambda v: 255 if v > 24 else 0).getbbox(); m = 40
    caja = (max(0, caja[0] - m), max(0, caja[1] - m), min(src.size[0], caja[2] + m), min(src.size[1], caja[3] + 3 * m))
    src, a_prod, a_somb = src.crop(caja), a_prod.crop(caja), a_somb.crop(caja)
    pb = a_prod.point(lambda v: 255 if v > 24 else 0).getbbox(); pw, ph = pb[2] - pb[0], pb[3] - pb[1]
    k = min(cfg.get('alto', ALTO_MAX) / ph, cfg.get('ancho', ANCHO_MAX) / pw)
    tam = (max(1, round(src.size[0] * k)), max(1, round(src.size[1] * k)))
    src, a_prod, a_somb = src.resize(tam, Image.LANCZOS), a_prod.resize(tam, Image.LANCZOS), a_somb.resize(tam, Image.LANCZOS)
    pb = tuple(round(v * k) for v in pb); pw, ph = pb[2] - pb[0], pb[3] - pb[1]
    ox = round((X0 + X1) / 2 - (pb[0] + pw / 2)); oy = cfg.get('base', BASE) - pb[3]
    assert ox + pb[0] >= X0 - 2 and ox + pb[2] <= X1 + 2, f'{slug}: el equipo se sale de la zona ({ox + pb[0]}–{ox + pb[2]})'

    lienzo = Image.open(fondo).convert('RGB'); assert lienzo.size == (W, H), f'{fondo}: no mide {W}×{H}'
    tinta = Image.new('RGB', (W, H), (2, 6, 14))
    # 1) sombra de contacto: elipse difusa bajo el equipo + la sombra de la foto original
    capa = Image.new('L', (W, H), 0); d = ImageDraw.Draw(capa); cx = ox + pb[0] + pw / 2; base = oy + pb[3]
    d.ellipse([cx - pw * .52, base - 26, cx + pw * .52, base + 44], fill=150)
    capa = capa.filter(ImageFilter.GaussianBlur(26)); capa.paste(ImageChops.lighter(capa.crop((ox, oy, ox + tam[0], oy + tam[1])), a_somb), (ox, oy))
    lienzo = Image.composite(tinta, lienzo, capa)
    # 2) reflejo: el equipo invertido, aplastado, difuminado y desvanecido hacia abajo
    rh = max(1, round(ph * .42)); rec = (pb[0], pb[1], pb[2], pb[3])
    ref = src.crop(rec).transpose(Image.FLIP_TOP_BOTTOM).resize((pw, rh), Image.LANCZOS).filter(ImageFilter.GaussianBlur(5))
    ra = a_prod.crop(rec).transpose(Image.FLIP_TOP_BOTTOM).resize((pw, rh), Image.LANCZOS).filter(ImageFilter.GaussianBlur(5))
    grad = Image.linear_gradient('L').rotate(180).resize((pw, rh)).point(lambda v: int(v * cfg.get('reflejo', .34)))
    lienzo.paste(ref, (ox + pb[0], base + 4), ImageChops.multiply(ra, grad))
    # 3) el equipo, tal cual la foto
    lienzo.paste(src, (ox, oy), a_prod)
    os.makedirs(SALIDA, exist_ok=True); out = os.path.join(SALIDA, f'serie-{slug}-hero.webp'); lienzo.save(out, 'WEBP', quality=92, method=6)
    return out, (ox + pb[0], oy + pb[1], ox + pb[2], base)


def series():
    rec = json.load(open(os.path.join(ROOT, 'src', 'app', 'core', 'data', 'recursos.json'), encoding='utf-8')); out = {}
    for f in rec['familias']:
        for s in f['series']:
            foto = s['tecnico'].get('foto_oficial')
            if foto and s['slug'] not in out and not s['comercial'].get('hero'): out[s['slug']] = os.path.join(ROOT, 'public', foto)
    return out


def main():
    args = sys.argv[1:]; disp = series(); fondos = sorted(f for f in os.listdir(FONDOS) if f.startswith('fondo-'))
    pedidas = sorted(disp) if '--todas' in args else [a for a in args if not a.startswith('--')]
    if not pedidas: print(__doc__); sys.exit(2)
    for slug in pedidas:
        if slug not in disp: print(f'  {slug}: sin foto oficial en el manifiesto (o ya tiene hero aprobado); se omite'); continue
        cfg = AJUSTES.get(slug, {}); n = cfg.get('fondo') or fondos[int(hashlib.sha256(slug.encode()).hexdigest(), 16) % len(fondos)]
        try: out, caja = monta(slug, disp[slug], os.path.join(FONDOS, n), cfg); print(f'  {slug}: {n} → {os.path.relpath(out, ROOT)}  equipo x {caja[0]}–{caja[2]}, y {caja[1]}–{caja[3]}')
        except Exception as e: print(f'  {slug}: NO se montó ({e})')


if __name__ == '__main__': main()
