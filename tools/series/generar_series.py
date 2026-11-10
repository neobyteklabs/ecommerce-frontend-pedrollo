#!/usr/bin/env python3
"""
Genera `src/app/core/data/series.json`: el contenido de la página `/serie/:slug` (la plantilla de la 2CP) para TODAS las series.

Entradas (en `tools/series/datos/`, solo hechos, sin prosa ajena):
  - `pedrollo-web-series.json`: por serie de pedrollo.com.mx, su tipo, las tablas «Características técnicas» y «constructivas» y los PDF.
  - `series-catalogo.json`: por serie del catálogo BSV, familia, subtipo, modelos (slug, del más barato al más caro), rango de HP y las
    series de la web que le corresponden (una serie del catálogo puede cubrir varias de la web: CP, JSW, HYDROFRESH MR…).

Los textos se arman con esos datos; no se copia la descripción comercial de Pedrollo. Lo escrito a mano en `core/catalog.ts` (`SERIES_MANUAL`,
hoy la 2CP) gana sobre lo generado. Las imágenes son huecos con nombre (`serie-<slug>-…`): se llenan después sin tocar este archivo.

Uso: python3 tools/series/generar_series.py
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
WEB = json.load(open(os.path.join(HERE, 'datos', 'pedrollo-web-series.json')))
CAT = json.load(open(os.path.join(HERE, 'datos', 'series-catalogo.json')))
FUENTE = 'Datos técnicos de la serie: pedrollo.com.mx, consultados el 10 de noviembre de 2026.'

CORTO = {'Altura manométrica': 'Altura', 'Altura manométrica de aspiración': 'Aspiración', 'Altura de aspiración manométrica': 'Aspiración',
         'Temperatura del líquido': 'Líquido', 'Temperatura ambiente': 'Ambiente', 'Presión máxima de trabajo': 'Presión máx.',
         'Máxima presión de trabajo': 'Presión máx.', 'Presión máxima': 'Presión máx.', 'Presión máxima en el cuerpo de la bomba': 'Presión máx.',
         'Grado de protección IP': 'Protección', 'Profundidad máxima de funcionamiento bajo el nivel del agua': 'Profundidad',
         'Paso de sólidos en suspensión': 'Paso de sólidos', 'Contenido máximo de arena': 'Arena máx.', 'Temperatura de trabajo': 'Temperatura'}
PRESTACIONES = ('Caudal', 'Altura manométrica', 'Altura', 'Elevación', 'Salidas simultáneas', 'Potencia', 'Volumen del tanque', 'Paso de sólidos en suspensión')
LIMITES = ('aspiración', 'Temperatura', 'Presión', 'Profundidad', 'Inmersión', 'arena', 'Nivel de vaciado')


def numero(v):
    m = re.search(r'(\d+(?:[.,]\d+)?)', v.replace(' ', ''))
    return float(m.group(1).replace(',', '.')) if m else None


def fusiona(slugs, campo):
    """Une las tablas de varias series web: mismo valor → uno; «hasta N» distintos → el mayor; lo demás → unidos con « · »."""
    orden, vals = [], {}
    for s in slugs:
        for k, v in WEB[s][campo]:
            if k not in vals: vals[k] = []; orden.append(k)
            if v not in vals[k]: vals[k].append(v)
    out = []
    for k in orden:
        vs = vals[k]
        if len(vs) > 1 and all(v.lower().startswith('hasta') and numero(v) is not None for v in vs): vs = [max(vs, key=numero)]
        out.append([k, ' · '.join(vs)])
    return out


def frase(pares): return ' '.join(f'{k}: {v}.' for k, v in pares)


def hp_txt(hp):
    if not hp: return None
    f = lambda x: ('%g' % x)
    return f'{f(hp[0])} HP' if hp[0] == hp[1] else f'{f(hp[0])} – {f(hp[1])} HP'


def genera(slug, c):
    serie, n = c['serie'], c['n']; webs = c['web']
    tec = fusiona(webs, 'tecnicas') if webs else []; con = fusiona(webs, 'constructivas') if webs else []
    tipo = (WEB[webs[0]]['tipo'] if webs else '') or c['subtipo'].capitalize().replace('pedrollo', 'Pedrollo')
    if len(tipo) > 70: tipo = c['familia'].capitalize()
    modelos = f'{n} modelo' + ('' if n == 1 else 's'); hp = hp_txt(c['hp'])
    d = dict(tec)
    caudal = d.get('Caudal'); altura = d.get('Altura manométrica') or d.get('Altura') or d.get('Elevación')
    datos = [x for x in [f'caudal {caudal}' if caudal else None, f'altura {altura}' if altura else None, f'potencias de {hp}' if hp and '–' in hp else (hp and f'potencia de {hp}')] if x]
    sub = f'{modelos} en el catálogo BSV' + (': ' + ', '.join(datos) + '.' if datos else '.') + ' Precio en línea y cotización con un asesor.'
    highlights = [f"{CORTO.get(k, k)} {v}" for k, v in tec if len(CORTO.get(k, k)) + len(v) <= 38][:6] or [modelos, c['familia'].capitalize()] + ([hp] if hp else [])

    pres = [p for p in tec if p[0].startswith(PRESTACIONES)]; lim = [p for p in tec if any(w.lower() in p[0].lower() for w in LIMITES) and p not in pres]
    otros = [p for p in tec if p not in pres and p not in lim]
    tabs = []
    if pres: tabs.append({'name': 'Prestaciones', 'slot': f'serie-{slug}-prestaciones · imagen pendiente', 'text': frase(pres)})
    if lim: tabs.append({'name': 'Límites de uso', 'slot': f'serie-{slug}-limites · imagen pendiente', 'text': frase(lim)})
    if con: tabs.append({'name': 'Construcción', 'slot': f'serie-{slug}-construccion · imagen pendiente', 'text': frase(con[:8])})
    if otros: tabs.append({'name': 'Motor y protección' if any(k in ('Motor', 'Grado de protección IP') for k, _ in otros) else 'Características', 'slot': f'serie-{slug}-motor · imagen pendiente', 'text': frase(otros)})
    tabs.append({'name': 'Modelos', 'slot': f'serie-{slug}-modelos · imagen pendiente',
                 'text': f'La serie {serie} tiene {modelos} en el catálogo BSV' + (f', de {hp}' if hp else '') + '. Abajo puedes compararlos y abrir la ficha de cada uno.'})

    stats = []
    if caudal: stats.append({'pre': 'Caudal', 'big': re.sub(r'\s*\(.*\)', '', caudal).replace('hasta ', ''), 'post': 'según modelo', 'fn': 'pedrollo.com.mx'})
    if altura: stats.append({'pre': 'Altura', 'big': re.sub(r'\s*\(.*\)', '', altura).replace('hasta ', ''), 'post': 'según modelo', 'fn': 'pedrollo.com.mx'})
    if hp: stats.append({'pre': 'Potencias' if '–' in hp else 'Potencia', 'big': hp, 'post': modelos, 'fn': 'Lista de precios Pedrollo'})
    stats = [s for s in stats if len(s['big']) <= 22]
    perf = {'head': f'Lo que entrega la serie {serie}.', 'lead': 'Valores máximos de la serie; el punto de trabajo de cada modelo está en su ficha técnica.', 'stats': stats if len(stats) >= 2 else []}

    tonos = [None, 'ivory', 'light', None, 'light', 'ivory']
    tiles = [{'w': 2, **({'tone': tonos[i % 6]} if tonos[i % 6] else {}), 'eyebrow': k, 'title': v if len(v) <= 48 else v[:45].rstrip() + '…', 'text': f'{k} de la serie {serie}.'} for i, (k, v) in enumerate(con[:6])]
    if tiles: tiles.append({'w': 6, 'tone': 'light', 'eyebrow': 'Datos', 'title': 'Todo lo demás está en la ficha.', 'text': 'Curvas, consumos, dimensiones y pesos, modelo por modelo, en la ficha técnica de cada producto.'})
    eng = {'head': 'De qué está hecha.', 'lead': 'Materiales de construcción de la serie.', 'tiles': tiles}

    filas = tec + con or [['Modelos en catálogo', str(n)], ['Familia', c['familia'].capitalize()]] + ([['Potencia', hp]] if hp else [])
    mitad = (len(filas) + 1) // 2
    return {'slug': slug, 'name': f'Serie {serie}', 'family': c['familia'], 'kicker': f'Serie {serie} · {tipo}', 'headline': [f'Serie {serie}.', tipo.rstrip('.') + '.'],
            'sub': sub, 'buyId': c['modelos'][0], 'highlights': highlights, 'tabs': tabs, 'perf': perf, 'eng': eng,
            'compare': {'head': f'¿Cuál {serie} es para ti?', 'lead': 'Todos los modelos de la serie con precio. La disponibilidad la confirma BSV.', 'models': c['modelos'][:3]},
            'specs': [filas[:mitad], filas[mitad:]], 'source': FUENTE if webs else 'Datos de la lista de precios Pedrollo vigente.'}


def main():
    out = {slug: genera(slug, c) for slug, c in sorted(CAT.items())}
    dest = os.path.join(ROOT, 'src', 'app', 'core', 'data', 'series.json')
    json.dump(out, open(dest, 'w'), ensure_ascii=False, separators=(',', ':')); open(dest, 'a').write('\n')
    print(f'{len(out)} series → {os.path.relpath(dest, ROOT)}; con datos de la web: {sum(1 for c in CAT.values() if c["web"])}')


if __name__ == '__main__': main()
