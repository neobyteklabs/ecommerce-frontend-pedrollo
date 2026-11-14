#!/usr/bin/env python3
"""Parche de fichas 60 Hz sobre recursos.json (14-nov-2026).

Enlaza como ficha principal PDFs oficiales que ya estaban en el banco como «otros_pdf», y añade dos que faltaban
(EASYSMALL de pedrollo.com.mx y FUTURE-JET de pedrollo.com). Los PDF van tal cual, sin modificar.
Es idempotente. Si se regenera el manifiesto con generar_manifiesto.py, hay que volver a correrlo.

Uso: python3 tools/banco/parche_fichas_2026_11_14.py
"""
import json, os, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REC = os.path.join(ROOT, 'src', 'app', 'core', 'data', 'recursos.json'); PUB = os.path.join(ROOT, 'public')

# (familia, serie) -> ficha única de la serie. Con `url`, se baja si no está.
UNICAS = {
    ('pozo-profundo', 'qem'): {'pdf': 'media/fichas/pozo-profundo/qem/QEM_ES_60HZ.pdf'},
    ('pozo-profundo', 'qet'): {'pdf': 'media/fichas/pozo-profundo/qet/QET_ES_60HZ.pdf'},
    ('hydrofresh', 'jsw'): {'pdf': 'media/fichas/hydrofresh/jsw/HF-JSW-PMR_ES_60HZ.pdf'},
    ('sumergibles-para-drenaje', 'tig-inox'): {'pdf': 'media/fichas/sumergibles-para-drenaje/tritus/TRITUS-INOX_ES-ficha-tecnica_60Hz.pdf'},   # trae TIG y TIGm
    ('presurizacion', 'easy'): {'pdf': 'media/fichas/presurizacion/easy/EASYSMALL_ES-ficha-tecnica_60Hz.pdf',
                                'url': 'https://pedrollo.com.mx/wp-content/uploads/sites/13/2026/10/EASYSMALL_ES-ficha-tecnica_60Hz.pdf'},
    ('centrifuga-autocebante', 'jetm'): {'pdf': 'media/fichas/autocebantes/jetm/FUTURE-JET_ES-ficha-tecnica_60Hz.pdf',
                                         'url': 'https://www.pedrollo.com/wp-content/uploads/schede-tecniche/ES/FUTURE-JET_ES-ficha-tecnica_60Hz.pdf'},
}
# Series con una ficha por bomba: el modelo decide. (familia, serie) -> [(texto en el modelo, pdf)], el primero que aparezca gana.
POR_MODELO = {
    ('presurizacion', 'hydrofresh-df'): [('JCR', 'HF-JCR-PDF_ES_60HZ.pdf'), ('JSW', 'HF-JSW-PDF_ES_60HZ.pdf'), ('PK', 'HF-PK-PDF_ES_60HZ.pdf')],
    ('presurizacion', 'hydrofresh-mr'): [('JCR', 'HF-JCR-PMR_ES_60HZ.pdf'), ('JSW', 'HF-JSW-PMR_ES_60HZ.pdf'), ('3-4CP', 'HF-3-4CP-PMR_ES_60HZ.pdf'),
                                         ('3CP', 'HF-3-4CP-PMR_ES_60HZ.pdf'), ('4CP', 'HF-3-4CP-PMR_ES_60HZ.pdf'), ('CP', 'HF-CP-PMR_ES_60HZ.pdf'), ('PK', 'HF-PK-PMR_ES_60HZ.pdf')],
}

def existe(rel):
    p = os.path.join(PUB, rel); return os.path.isfile(p) and open(p, 'rb').read(5) == b'%PDF-'

def main():
    d = json.load(open(REC, encoding='utf-8')); n = 0
    for f in d['familias']:
        for s in f['series']:
            k = (f['slug'], s['slug'])
            if k in UNICAS:
                u = UNICAS[k]; rel = u['pdf']
                if not existe(rel):
                    if 'url' not in u: raise SystemExit(f'falta {rel}')
                    os.makedirs(os.path.dirname(os.path.join(PUB, rel)), exist_ok=True)
                    req = urllib.request.Request(u['url'], headers={'User-Agent': 'Mozilla/5.0'})
                    data = urllib.request.urlopen(req, timeout=60).read()
                    if data[:5] != b'%PDF-': raise SystemExit(f'{u["url"]} no devolvió un PDF')
                    open(os.path.join(PUB, rel), 'wb').write(data); print(f'  bajado {rel} ({len(data)//1024} KB)')
                s['tecnico']['ficha_60hz'] = rel
                s['tecnico']['otros_pdf'] = [o for o in s['tecnico'].get('otros_pdf', []) if o != rel]
                for m in s['modelos']:
                    m['technical'] = rel; m.setdefault('placeholder', {})['technical'] = False
                    if m.get('nota') == 'Sin ficha 60 Hz en el banco.': m['nota'] = None
                n += 1; print(f'  {k[0]}/{k[1]}: ficha de serie → {os.path.basename(rel)} ({len(s["modelos"])} modelos)')
            elif k in POR_MODELO:
                base = f'media/fichas/{k[0]}/{k[1]}/'
                for m in s['modelos']:
                    for texto, pdf in POR_MODELO[k]:
                        if texto in m['modelo'].upper():
                            if not existe(base + pdf): raise SystemExit(f'falta {base + pdf}')
                            m['technical'] = base + pdf; m.setdefault('placeholder', {})['technical'] = False
                            if m.get('nota') == 'Sin ficha 60 Hz en el banco.': m['nota'] = None
                            break
                n += 1; print(f'  {k[0]}/{k[1]}: ficha por modelo → {sorted({os.path.basename(m["technical"]) for m in s["modelos"] if m.get("technical")})}')
    json.dump(d, open(REC, 'w', encoding='utf-8'), ensure_ascii=False)
    print(f'{n} series actualizadas.')

if __name__ == '__main__': main()
