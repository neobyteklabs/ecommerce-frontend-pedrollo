# Tienda Pedrollo · Bombas y Sistemas Vega

Ecommerce B2B/B2C en **Angular 22 + Tailwind 4** (SSR, zoneless, signals) para BSV, distribuidor Pedrollo en México. Sistema de diseño multi-marca por tokens; frontend fijado en Pedrollo.

Lee `CONTEXTO.md` para el contexto completo: decisiones, módulos, reglas de recursos y pendientes.

## Arranque

```bash
npm install
export BACKOFFICE_URL=http://localhost:8082        # el ecommerce-backend (bala 1)
export STORE_KEY=<APP_STORE_KEY_PEDROLLO>          # llave de tienda; nunca en un archivo versionado
npm start            # http://localhost:4200
npm run build        # SSR + prerender (solo legales: home, categorías y series dependen de la API); no necesita el backend
```

Las dos variables son obligatorias para servir: sin ellas `server.ts` lo dice en el log y cada petición responde 500.
Viven solo en el proceso Node: el navegador llama a `/api/tienda/...` en su propio origen y `server.ts` reenvía al
back-office con `X-Store-Key`. Guárdalas en `.env.local` (ignorado por git, `*.local`): **`npm start` lo carga solo**
si existe. Desde IntelliJ, la run config «Angular CLI Server» corre `npm start`, así que también lo toma; si prefieres
no tener el archivo, pon las dos variables en la run config.

Modo revisión (muestra recursos pendientes con etiqueta; protegerlo en producción): `http://localhost:4200/?revision=1` · apagar con `?revision=0`.

Rutas útiles: `/serie/2cp` · `/producto/2cp-32-210a` · `/categoria/multietapas` · `/carrito?demo=1` · `/checkout?step=2&declined=1` · `/login?expired=1`.

## Estructura

```
src/
  styles.css               Tailwind + @theme mapeado a los tokens + @utility container
  styles/                  tokens.css (3 marcas) · base · components · premium · serie · motion
  app/core/                brand · products · catalog (familias + narrativa 2CP) · resources (manifiesto) · images · cart · session · toast · review
  app/core/api/            storefront-api.ts (cliente de la API de tienda: ficha, familias, series, listado, facetas) · storefront-view.ts (CardItem para tarjetas)
  app/core/data/           familias_crm.json · recursos.json (generado, no editar a mano)
  app/shared/ui/           bsv-header, bottombar, footer, product-card, img-slot, price, qty, timeline, stepper, alert, empty, skeleton, toasts, icon
  app/shared/directives/   bsvReveal · bsvSpotlight · bsvCountUp
  app/features/            catalog (home, category, search, product, series) · cart · auth · checkout · account · legal
public/brand/              logotipo dual Pedrollo · Vega (dual-horizontal*.svg); ver core/brand.ts
public/media/              catalogo/ fichas/ tecnico/ revision/ comercial/ comerciales/  (generado desde el banco; Git LFS)
prototype/                 prototipo HTML, sistema de diseño, export a Figma
tools/banco/               generar_manifiesto.py · instalar_lote_estilizado.py · reportes
```

## Recursos y aprobación

Todo recurso visual entra con su estado de origen y **no se publica** hasta aprobarse en su manifiesto del banco (ver `CONTEXTO.md` §5 y `tools/banco/RECURSOS.md`). Flujo:

1. Editar el banco (nueva foto, paquete técnico, lote de heros, cambio de estado).
2. En el banco: `python3 generar_manifiesto.py --out <ruta-de-este-repo>`.
3. Commit de `src/app/core/data/recursos.json` y `public/media/`.

## Git

**Ramas:** el trabajo va a `develop`; `master` solo recibe liberaciones (merge desde `develop`). Las balas 1 y F1
entraron directo a `master` porque el repo nació con una sola rama; desde el 2026-10-23 cada hand-off se abre en `develop`.

`public/media/**`, `*.pdf`, `*.png`, `*.jpg` y `*.webp` van por **Git LFS** (`.gitattributes`). Antes del primer push:

```bash
git lfs install
```

Si prefieres no versionar los medios, añade `public/media/` al `.gitignore` y sírvelos desde CDN; el código no cambia (las rutas son relativas a `media/`).

## Pendientes de integración

API de catálogo y precios · OIDC real · Stripe Elements + 3DS · pedidos, factura y devoluciones · CDN para medios · proteger el modo revisión.
