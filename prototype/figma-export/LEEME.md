# Exportar a Figma con html.to.design

Cada archivo es una pantalla ya renderizada, autocontenida (CSS inline, sin JS), con las capas
nombradas por componente mediante `data-component` y por token mediante las clases.

Nombre: `NN-pantalla--viewport.html`. `mobile` = 360 px, `desktop` = 1280 px.

## Pasos
1. En Figma instala el plugin **html.to.design** (Divriots) y ábrelo en el archivo destino.
2. Pestaña **Import → File** (o arrastra el .html al plugin). Importa primero `00-sistema-diseno--desktop.html`:
   crea los estilos de color y texto con el nombre de cada token (`primary`, `ink`, `gold-text`…).
3. Importa el resto. Cada `data-component` llega como frame con su nombre
   (`Header`, `ProductCard`, `OrderTimeline`, `BuyPill`, `EngineeringBento`…).
4. Para convertir un frame en componente de Figma: selecciónalo → Ctrl+Alt+K. Para los estados
   (hover, loading, error) usa las variantes que ya están dibujadas una al lado de otra en `00-sistema-diseno`.
5. Las imágenes son huecos con su nombre dentro (`data-slot`); se reemplazan en Figma por fill de imagen.

## Qué no viaja a Figma
Las interacciones (pestañas, cantidad, toasts, cambio de marca) son comportamiento de código. Para verlas,
abre el prototipo HTML (`../prototipo.html` con un servidor local). En Figma se reconstruyen con
Prototype → Interactions si hace falta presentarlas.

## Tokens → Figma Variables (opcional)
Los valores están en `../css/tokens.css`. Con el plugin **Tokens Studio** se importan como variables
de Figma y se enlazan a los estilos creados en el paso 2.
