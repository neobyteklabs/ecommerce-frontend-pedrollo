# Recursos visuales de la tienda · reglas y flujo

## Dos categorías

| | Comerciales (por serie) | Técnicos (por serie/modelo) |
|---|---|---|
| Qué son | Hero cinematográfico, banner, video, galería de campaña | Foto oficial de pedrollo.com.mx, ficha técnica 60 Hz, curvas, dimensiones |
| Dónde viven | `<FAMILIA>/<SERIE>/comercial/hero.webp`, `banner.webp`, `video.mp4`, otros | `<FAMILIA>/<SERIE>/<slug>.jpg` y `<FAMILIA>/<SERIE>/<slug>/*.pdf` |
| Dónde se usan | Hero y banner de la página de serie, banner del home, galería secundaria de la ficha | Imagen principal de card y ficha, descargas, tabla de especificaciones |
| Regla | Representan a la serie. Se etiquetan como representativos. Nunca se presentan como la foto exacta de un modelo. | Especificaciones solo de la ficha 60 Hz. Si un dato no está, queda vacío ("pendiente"). |

## Manifiesto

`python3 generar_manifiesto.py` lee `familias_crm.json`, `mapeo_series.json`, el crawl de `_raw/` y las carpetas `comercial/`,
parsea todas las fichas 60 Hz con `pdftotext`, valida cada modelo del CRM (kW, HP, fase, tensión) y escribe:

- `manifiesto_recursos.json` — por familia → serie → `comercial`, `tecnico`, `modelos[]` con rutas `catalog`, `hero`, `gallery`, `technical`, `video` y banderas `placeholder`.
- `VALIDACION.md` — tabla modelo ↔ ficha con el estado: validado / no está en la ficha / sin ficha 60 Hz.
- Copia los archivos al proyecto Angular: `public/media/{comercial,catalogo,fichas}/<familia>/<serie>/…` y `src/app/core/data/recursos.json`.

## Sustituir una imagen editada

1. Reemplaza el archivo en `comercial/` (mismo nombre: `hero.webp`, `banner.webp`).
2. `python3 generar_manifiesto.py`.
3. En Angular no hay que tocar nada: `core/images.ts` y `core/products.ts` leen el manifiesto.

## Placeholders

Un hueco sin recurso muestra su nombre (`serie-4sr-hero · hero cinematográfico pendiente`, `foto-pk-60 · fotografía original del modelo · pendiente`). Son identificables a simple vista y en Figma.

## Ejemplo de validación

Ficha 2CP 60 Hz: `2CP 32/210A` = 7.5 kW / **10 HP**, trifásica 220/380/440 V. `2CP 32/210B` = 5.5 kW / 7.5 HP.
Los `2CP 25/16A/B` del CRM no aparecen en esa ficha: quedan con especificaciones pendientes, no se estiman.

## Paquetes técnicos por serie (recortes fieles del PDF)

Carpeta `<FAMILIA>/<SERIE>/tecnico/` con la estructura del paquete piloto (`data/manifest_<serie>_60hz.json`, `data/models_<serie>_60hz.csv`, `technical/*.png`, `original/`, `README.txt`).
El generador lee el manifest, respeta la asociación modelo → curva / tabla de prestaciones / tabla de consumos y los recortes compartidos (despiece, características, dimensiones), y copia todo tal cual a `public/media/tecnico/...`. Nunca se redibujan ni se generan con IA.

**Estado de aprobación.** La columna `estado` del CSV manda: solo `aprobado` se publica. `pendiente aprobacion` se conserva en el manifiesto pero la tienda no lo muestra al público; en modo revisión (`?revision=1`, se recuerda en la sesión; `?revision=0` para salir) se ve con la etiqueta "Pendiente de aprobación". Para aprobar: cambiar `estado` a `aprobado` en el CSV y correr el generador.

**Modelos solo en ficha.** Un modelo que está en el paquete pero no en los ejemplos del CRM (p. ej. 2CP 32/200C) entra al manifiesto con `en_crm: false` y nota "confirmar en lista BSV"; público no lo ve, revisión sí.

**Fotografía.** `original/` es imagen referencial de familia (`catalog_es_foto_de_serie: true`). Una foto solo se vincula a un modelo si el manifest trae `catalog_image` con `exact_model_image_verified: true`.

Piloto cargado: `MULTIETAPAS/2CP/tecnico/` (9 modelos, 60 Hz, México). Los 2CP 25/14 y 25/16 no reciben curvas de este paquete (nota del propio paquete).

## Lote global de revisión (`_lotes/revision_global_60hz/`)

Entrada: `manifest_revision_global.json`, `revision_productos.csv`, `resumen_familias.csv` y `technical/*.png` (páginas completas del PDF, sin modificar: primera página de prestaciones detectada y página identificada como características constructivas), por slug de pedrollo.com.mx.

El generador verifica el sha256 de cada PDF contra el banco, copia los previews a `public/media/revision/<familia>/<serie>/<slug>/` y los deja en `tecnico.revision[]` de cada serie con todos sus estados (`pendiente_revision`, `sin_verificar`, `publicable=false`). **Nada del lote se publica.** En modo revisión la ficha de producto los muestra en las pestañas Curvas y Componentes con la leyenda "VISTA PRELIMINAR DE REVISIÓN · no es la curva específica del modelo", y la página de serie en una sección "Revisión". Los recortes aprobados de un paquete por serie (como el piloto 2CP) tienen prioridad sobre el lote.

Reporte: `REPORTE_REVISION.md` (familias listas para revisión, documentos sin sección constructiva, productos con asociaciones pendientes). Se regenera con cada corrida.

Para aprobar progresivamente: convertir las páginas correctas en un paquete por serie (`<SERIE>/tecnico/` con manifest + CSV con `estado = aprobado`), como en el piloto 2CP.

## Paquetes multimedia comerciales por serie (`<SERIE>/comercial/<paquete>/manifest_*multimedia*.json`)

Derivados fieles de la foto de referencia de familia (catálogo 1:1 re-codificado y detalles macro recortados con píxeles originales). Son recursos **comerciales**: viven en `comercial.multimedia[]`, separados de los técnicos de 60 Hz, y nunca se marcan como foto verificada de un modelo (`verificada_modelo: false`, `tipo_fuente: family_reference_not_exact_model_verified`).
`status` manda: solo `aprobado` se publica; `revision_pendiente` se ve en `?revision=1` con etiqueta. En la ficha de producto van en la pestaña Fotografía después de la foto oficial y de las cinematográficas, sin desplazar fotos verificadas de modelo (si existieran, van primero). En la página de serie forman la sección "Galería de familia". `installed_scene` no producido: no se inventa una escena.

Paquete cargado: `MULTIETAPAS/2CP/comercial/multimedia_v1/` (1 catálogo 1:1 + 4 macros), `status = revision_pendiente`.

## Recursos comerciales por FAMILIA (`comerciales/familias/<FAMILIA>/`)

Imágenes estilizadas de familia (`asset_type = hero_stylized`): banners de familia, encabezados de categoría, bloques promocionales y heros. Son de **familia**, no de SKU; nunca sustituyen fotos técnicas, fotos verificadas por modelo, diagramas, curvas ni fichas 60 Hz, y viven aparte de los paquetes técnicos y de los comerciales por serie.

Instalación: `python3 instalar_lote_estilizado.py <zip> [<zip>…]`. Lee `manifest_<lote>_estilizado.json`, deja el PNG original intacto en `hero/vN__*.png`, genera `hero/vN__*.webp` (mismos píxeles, re-codificado para web) y registra la versión en `comerciales/familias/<FAMILIA>/manifest.json`. **Nunca sobrescribe**: un segundo lote para la misma familia entra como v2 y la anterior se conserva; `actual` apunta a la última publicable o, si no hay, a la última para revisión.

Publicación: `status = aprobado` y `publicable = true` en el manifest.json de la familia; mientras tanto solo se ve en `?revision=1` con etiqueta "Pendiente de aprobación visual". La tienda los usa en el encabezado de cada categoría y en el bloque "Una bomba para cada trabajo" del home.

Lotes cargados: `lote1` (10 familias) y `lote2` (6 familias), 16 familias con v1 en `revision_required`. Cuatro familias de lote2 (EP15-PKM80, HYDROFRESH, ASYPRESS, SISTEMA-COMPACTO) no son categorías navegables de la tienda; sus assets quedan registrados para cuando se decida dónde mostrarlos.
