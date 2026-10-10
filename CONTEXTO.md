# Contexto completo del proyecto · Tienda Pedrollo (Bombas y Sistemas Vega)

Última actualización: 9 de octubre de 2026.

## 1. Qué es

Ecommerce B2B/B2C de **Bombas y Sistemas Vega, S.A. de C.V. (BSV)**, distribuidor autorizado en México. Primer frontend: marca **Pedrollo**. El sistema es multi-marca por tokens: después vendrán Barmesa y Evans cambiando solo `data-brand` en `<html>`.

Clientes: plomeros, contratistas, ingenieros, ferreterías y usuarios finales. Mercado México, 60 Hz. Precios en MXN con IVA.

Contacto BSV: 55 7258 9681 · 55 7098 6532 · Tlalnepantla de Baz, Estado de México; CEDIS en Azcapotzalco, Puebla, Zapopan y Mérida.

## 2. Qué hay en este repositorio

| Carpeta | Contenido |
|---|---|
| `src/` | Aplicación Angular 22 (SSR, zoneless, signals) + Tailwind 4 |
| `public/media/` | Recursos del catálogo copiados desde el banco de imágenes (ver §5). ~300 MB, en Git LFS |
| `prototype/` | Prototipo HTML original (sistema de diseño, 12 pantallas, cambio de marca) y export a Figma |
| `tools/banco/` | Scripts y reportes del banco de recursos: generador del manifiesto, instalador de lotes, validación |
| `CONTEXTO.md` | Este documento |
| `README.md` | Arranque, estructura y convenciones |

El **banco de imágenes** (fotos, PDFs, paquetes) vive fuera del repositorio, en la máquina de diseño, en `~/develop/bys/ecommerce-design/pedrollo/`. Los scripts de `tools/banco/` se corren ahí y escriben en este proyecto.

## 3. Historia de decisiones (en orden)

1. **Sistema de diseño multi-marca** con tokens (`src/styles/tokens.css`): color, tipografía, radios, sombras, espaciado. Tres juegos: Pedrollo (#1A4F9C), Barmesa (#0A7BC2), Evans (#C8102E). Todos los pares de color pasan AA; el naranja de marca falla con blanco, así que `accent` es #C2410C.
2. **Look premium** tipo Apple: capa `premium.css` con tinta (#0A0D14), dorado (#D4AF37, solo sobre tinta; `gold-text` #8A6D12 sobre blanco) y marfil. Cada marca tiene `primary-on-dark` porque el azul falla AA sobre tinta.
3. **Página de serie narrativa** calcada de apple.com/macbook-pro (`/serie/2cp`): sub-barra fija, hero, pestañas, cifras, bento de ingeniería, comparador. Solo la 2CP tiene narrativa; las demás 89 series usan un formato genérico construido con el manifiesto.
4. **Movimiento**: reveal al scroll, hover con foco de luz, contadores, píldora de compra. Sin dependencias; directivas `bsvReveal`, `bsvSpotlight`, `bsvCountUp`. Respeta `prefers-reduced-motion`.
5. **Stack elegido**: Angular + Tailwind (el usuario se inclinó por ello; Astro se descartó porque la tienda es una app con sesión, carrito y checkout).
6. **Sin selector de marca** visible: el frontend está fijado en Pedrollo; `cambio-marca.html` del prototipo demuestra el mecanismo.
7. **Catálogo real del CRM**: 12 familias navegables, 90 series, 345 modelos (ejemplos del CRM + modelos de fichas). `familias_crm.json` es la fuente.
8. **Nada inventado**: precios y disponibilidad son `null` ("por confirmar"), las especificaciones salen únicamente de la ficha técnica 60 Hz, y lo que no está en la ficha se muestra como "pendiente".
9. **Recursos visuales en dos categorías** (§5) con **aprobación progresiva**: todo lo que entra queda pendiente y solo se publica cuando se aprueba explícitamente en su manifiesto.
10. **Modo revisión** (`?revision=1`, se recuerda en sessionStorage; `?revision=0` lo apaga): muestra recursos pendientes con etiqueta. El público nunca los ve. En producción hay que proteger este modo (p. ej. detrás de autenticación o solo en staging).

## 4. Módulos de la tienda

| Módulo | Ruta | Estado |
|---|---|---|
| Home | `/` | Hecho. Hero de campaña 2CP, familias, destacados, confianza, promos por familia (si aprobadas), banner |
| Categoría | `/categoria/:slug` | Hecho. Encabezado con hero de familia (si aprobado), chips por serie, filtros reales (HP, tensión, fase, validación) |
| Búsqueda | `/buscar?q=` | Hecho, con estado vacío |
| Serie | `/serie/:slug` | Hecho (narrativa 2CP + genérica) |
| Producto | `/producto/:id` | Hecho. Galería con pestañas Fotografía · Curvas · Componentes · Ficha técnica; specs de ficha 60 Hz; cotizar |
| Carrito | `/carrito` | Hecho; totales "por cotizar" mientras no haya precios |
| Login | `/login` | Maqueta (Google/Facebook simulados, guard de rutas) |
| Checkout | `/checkout?step=1..3` | Maqueta (3 pasos, 3DS, rechazo, error de red) |
| Cuenta | `/cuenta` | Maqueta (direcciones, datos fiscales) |
| Pedidos | `/cuenta/pedidos`, `/cuenta/pedidos/:id` | Maqueta (línea de tiempo, guía) |
| Factura | `/cuenta/factura` | Maqueta |
| Devolución | `/cuenta/devolucion` | Maqueta |
| Legales | `/legal` | Hecho |
| Correos | `prototype/correos.html` | Solo prototipo |

Casos límite cubiertos: carrito vacío, búsqueda sin resultados, producto no disponible, pago rechazado, precio cambiado, sesión expirada, error de red.

## 5. Recursos visuales: reglas y estados

**Dos categorías, nunca mezcladas.**

- **Comerciales** (representativos, nunca "la foto exacta" de un modelo):
  - por **serie**: hero y banner cinematográficos (`comercial.hero/banner`), paquete multimedia (catálogo 1:1 y macros derivados de la foto de familia, `comercial.multimedia[]`);
  - por **familia**: hero estilizado con versiones (`familias[].comercial.hero_stylized`), para encabezados de categoría, promos y banners.
- **Técnicos** (por serie/modelo): foto oficial de pedrollo.com.mx (`tecnico.foto_oficial`, referencia de familia), ficha 60 Hz (`tecnico.ficha_60hz`), recortes fieles por modelo de un paquete técnico (`modelos[].recortes`: curva, tabla de prestaciones, consumos; compartidos: despiece, características, dimensiones), y vistas preliminares del lote global de revisión (`tecnico.revision[]`: página completa del PDF).

**Reglas fijas.** La foto oficial es imagen referencial de familia; solo se marca una foto como verificada de un modelo si el paquete lo declara (`exact_model_image_verified: true`), y entonces va primero sin ser sustituida. Los recortes técnicos se muestran tal cual, nunca redibujados ni generados con IA. "Primera página de prestaciones detectada" no es la curva específica de un modelo. No se infieren curvas de modelos no documentados (p. ej. 2CP 25/14 y 25/16).

**Estados y publicación.** Cada recurso trae su estado desde su manifiesto de origen (CSV o JSON): `pendiente aprobacion`, `revision_pendiente`, `revision_required`, `pendiente_revision`… Solo `aprobado`/`publicable=true` se publica. Todo lo cargado hasta hoy está pendiente:

| Recurso | Dónde se aprueba |
|---|---|
| Recortes técnicos 2CP (9 modelos) | `MULTIETAPAS/2CP/tecnico/data/models_2cp_60hz.csv`, columna `estado` → `aprobado` |
| Multimedia 2CP (catálogo 1:1 + 4 macros) | `MULTIETAPAS/2CP/comercial/multimedia_v1/manifest_2cp_multimedia_v1.json`, `status` → `aprobado` |
| Heros estilizados de 16 familias | `comerciales/familias/<FAMILIA>/manifest.json`, versión: `status: aprobado`, `publicable: true` |
| Lote global de revisión (93 páginas) | No se aprueba como tal: se convierte en paquetes técnicos por serie con las páginas correctas |

Tras cualquier cambio en el banco: `python3 generar_manifiesto.py` (en el banco) regenera `src/app/core/data/recursos.json` y copia `public/media/`.

## 6. Validación de modelos contra fichas 60 Hz

`generar_manifiesto.py` parsea las 258 fichas con `pdftotext`, extrae kW/HP/fase/tensión por modelo y cruza con los modelos del CRM. Resultado actual: 65 de 345 validados; 184 "no localizados en la ficha" (mayormente diferencias de nomenclatura CRM vs ficha) y 96 de series sin ficha 60 Hz en el banco. Reporte en `tools/banco/VALIDACION.md`. Ejemplo verificado: 2CP 32/210A = 7.5 kW / 10 HP, trifásica 220/380/440 V.

## 7. Pendientes para producción

- Integraciones: API de catálogo y lista de precios BSV, OIDC real (Google/Facebook), Stripe Elements + 3DS, endpoints de pedidos, factura (contabilidad timbra) y devoluciones, subida de fotos.
- Proteger el modo revisión en producción.
- Servir `public/media` desde CDN/R2 (los PDF pesan 186 MB).
- Aprobación progresiva de recursos (§5), empezando por 2CP, Autocebantes y Multietapas.
- Decidir destino de 4 familias del lote 2 que no son categorías navegables (EP15-PKm80, Hydrofresh, Easypress 115V, DG BLU).
- Afinar el emparejamiento CRM ↔ ficha con la lista oficial de precios (nombres exactos).
- Imágenes editadas finales por familia (las actuales son sin editar) y escenas instaladas solo con fotografía real.

## 8. Convenciones de código

- Clases CSS del sistema (`.btn`, `.card`, `.product-card`, `.badge-*`) son la API visual; Tailwind solo para layout y siempre con tokens del `@theme`.
- Cada componente raíz lleva `data-component="Nombre"`, el mismo nombre que en Figma.
- Nada de `window`/`localStorage` fuera de `afterNextRender` o sin `isPlatformBrowser` (SSR).
- Tablas con control flow dentro de `<tbody>` (hidratación). `bsv-img-slot` usa `[class]` completo: la clase extra va por `cls`, no por `class=`.
- Tailwind 4 trae su propia utilidad `container`; está redefinida con `@utility container` en `styles.css`.

## 9. Animaciones de vídeo tipo Apple

`src/app/shared/directives/inline-media.ts` replica el `data-inline-media` de apple.com: `<video bsvInlineMedia [src] anchor load play mode loop>`. Carga el vídeo cuando el ancla está a `load` (150vh) de entrar, lo reproduce cuando entra (`play`, 60vh) y lo pausa y reinicia al salir; `mode="scrub"` sincroniza `currentTime` con el progreso de scroll (vista de producto fotograma a fotograma). Respeta `prefers-reduced-motion`. El hero de serie lo usa si el manifiesto trae `comercial.video` (archivo `video.mp4|webm` en `<SERIE>/comercial/`). Los vídeos deben ser reales o aprobados visualmente: no se generan escenas sintéticas.
