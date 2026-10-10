# BSV Tienda · sistema de diseño y prototipo del MVP

Prototipo navegable en HTML/CSS plano, sin build. Un solo diseño para Pedrollo, Barmesa y Evans.

## Cómo verlo

```bash
python3 -m http.server 4321
```

Abre http://localhost:4321/prototipo.html (índice de pantallas) o cualquiera de:

| Entregable | Archivo |
|---|---|
| 1 · Sistema de diseño (tokens, tipografía, componentes con estados) | `sistema-diseno.html` |
| 2 · Las 12 pantallas, móvil y escritorio | `prototipo.html` |
| 3 · Flujo principal navegable | `index.html` → … → `pedido.html` |
| 4 · Cambio de marca (mismo HTML, tres marcas) | `cambio-marca.html` |

Este frontend es Pedrollo. El sistema es genérico: `data-brand` en `<html>` cambia los tokens y `cambio-marca.html` lo demuestra con `?brand=barmesa` / `?brand=evans`. No hay selector visible para el usuario final.

## Dónde vive cada cosa

- `css/tokens.css` — todos los tokens. La marca se cambia con `data-brand` en `<html>`; solo se redefinen 9 variables.
- `css/components.css` — un bloque por componente. La clase raíz es el nombre del componente en Figma.
- `js/app.js` — cabecera, pie y barra inferior como custom elements, carrito en localStorage, iconos Lucide inline, datos de ejemplo.

## Imágenes

Todo hueco de imagen es un `<div class="img-slot" data-slot="nombre">`. El nombre indica qué va ahí (por ejemplo `hero-home`, `pkm-60`, `cat-sumergibles`). Para llenarlo, mete un `<img>` dentro y añade la clase `has-img`. Los logos se buscan en `assets/logo-pedrollo.svg`, `logo-barmesa.svg`, `logo-evans.svg`; mientras no existan se muestra el wordmark tipográfico.

## Exportar a Figma

1. Instala el plugin **html.to.design** en Figma.
2. Corre el servidor local y pega la URL de cada pantalla (añade `?proto=0` para ocultar el selector de marca).
3. Cada capa llega con el nombre de su `data-component` o de su clase raíz (`ProductCard`, `OrderTimeline`, `Header`…). Los colores llegan como estilos con el nombre del token.
4. Para las tres marcas, importa la misma URL con `?brand=pedrollo`, `?brand=barmesa` y `?brand=evans`.

## Para el equipo de Angular + Tailwind

`tailwind.config.js` solo mapea variables:

```js
colors: { primary: 'var(--color-primary)', 'primary-hover': 'var(--color-primary-hover)', accent: 'var(--color-accent)', surface: 'var(--color-surface)', text: 'var(--color-text)', muted: 'var(--color-text-muted)', border: 'var(--color-border)', … },
borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)' },
fontFamily: { display: ['Inter Tight'], body: ['Inter'], mono: ['JetBrains Mono'] },
```

Un `BrandService` pone `data-brand` al arrancar y expone nombre y logo como `InjectionToken`.

## Capa premium

`css/premium.css` se carga después de `components.css` y solo usa tokens. Aporta el lenguaje tipo Apple: heros y pie en `ink`, filetes `gold`, botones píldora, cards sin borde que flotan al hover y tipografía display más grande. Para volver al look plano basta con quitar esa hoja.

## Página de serie (narrativa tipo Apple)

`serie.html` + `css/serie.css`: landing de la serie 4SR con sub-barra fija (nombre + Comprar), hero a pantalla completa con titular en degradado, chips de destacados, "Mírala a detalle" con pestañas, cifras grandes de rendimiento, bento de ingeniería, comparador de 3 modelos y resumen de especificaciones. Toda cifra no confirmada lleva la marca *(ejemplo)*. Para otra serie (PKm, CPm) se duplica el archivo y se cambian textos y `data-slot`.

## Movimiento

`css/motion.css` + `js/motion.js`, sin dependencias. Todo cuelga de `html.motion` (lo pone el script), así que sin JS, en los exportes a Figma y con `prefers-reduced-motion` se ve el estado final.

- Reveal al desplazarse con IntersectionObserver, escalonado por hermanos (`--i`), una sola vez.
- Hover en cards: elevación, filete dorado superior, foco de luz que sigue al cursor (`--mx/--my`), imagen a 1.04 y CTA "Ver producto →".
- Contadores en las cifras grandes de la página de serie, sub-barra con sección activa, píldora de compra que aparece tras el hero, parallax leve en la imagen del hero.
- Equivalencia en Angular: directivas `[bsvReveal]`, `[bsvSpotlight]`, `[bsvCountUp]` y un servicio de scroll. Las clases y variables CSS se copian tal cual.
