#!/usr/bin/env python3
"""Organiza _raw/ (crawl de pedrollo.com.mx) por familia/serie del CRM.
Uso: python3 organizar_familias.py
Lee: _raw/productos.json, familias_crm.json, mapeo_series.json
Deja: <FAMILIA>/<SERIE>/<slug>.jpg + <slug>/*.pdf (copias), INDICE.md, series_sin_imagen.txt
"""
import json, os, re, shutil, unicodedata

raw = "_raw"
prods = {p["slug"]: p for p in json.load(open(f"{raw}/productos.json"))}
series = json.load(open("familias_crm.json"))
mapeo = json.load(open("mapeo_series.json"))

def carpeta(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").upper()
    return s[:40]

usados, sin_img, filas = set(), [], []
for s in series:
    key = f"{s['familia']}|{s['serie']}"
    slugs = mapeo.get(key, [])
    if not slugs:
        sin_img.append(f"{s['familia']} | {s['serie']} | {s['n']} productos | ej. {', '.join(s['ejemplos'][:3])}")
        continue
    dest = os.path.join(carpeta(s["familia"]), carpeta(s["serie"]))
    os.makedirs(dest, exist_ok=True)
    for slug in slugs:
        p = prods.get(slug)
        if not p:
            print("slug no existe en productos.json:", slug); continue
        usados.add(slug)
        if p.get("image_file"):
            src = f"{raw}/img/{p['image_file']}"
            dst = os.path.join(dest, p["image_file"])
            if not os.path.exists(dst): shutil.copy2(src, dst)
        for pdf in p["pdfs"]:
            if "50Hz" in pdf or "50HZ" in pdf: continue  # México es 60 Hz
            src = f"{raw}/pdf/{slug}/{pdf}"
            if os.path.exists(src):
                os.makedirs(os.path.join(dest, slug), exist_ok=True)
                dst = os.path.join(dest, slug, pdf)
                if not os.path.exists(dst): shutil.copy2(src, dst)
    filas.append((s["familia"], s["serie"], s["n"], ", ".join(slugs), dest))

with open("INDICE.md", "w") as f:
    f.write("# Banco de imágenes Pedrollo — índice por familia del CRM\n\n")
    f.write("| Familia CRM | Serie | # productos | Páginas Pedrollo | Carpeta |\n|---|---|---|---|---|\n")
    for fam, ser, n, slugs, dest in filas:
        f.write(f"| {fam} | {ser} | {n} | {slugs} | `{dest}/` |\n")
    f.write(f"\n## Series del CRM sin imagen de origen ({len(sin_img)})\n\n")
    for l in sin_img: f.write(f"- {l}\n")
    no_usados = sorted(set(prods) - usados)
    f.write(f"\n## Páginas de Pedrollo no asignadas a ninguna serie del CRM ({len(no_usados)})\n\n")
    for s in no_usados: f.write(f"- {s} — {prods[s]['title']}\n")
open("series_sin_imagen.txt", "w").write("\n".join(sin_img) + "\n")

print("series con imagen:", len(filas), "| sin imagen:", len(sin_img), "| páginas Pedrollo usadas:", len(usados), "/", len(prods))
