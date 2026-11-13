# ============================================================
# Imagen de la tienda Pedrollo: el servidor Node (Express) que renderiza (SSR)
# y hace de proxy hacia el backend con la llave de tienda.
#
# Espera el build ya hecho en dist/. `ng build` corre FUERA (pipeline o local):
# el bundle del servidor es autocontenido (no necesita node_modules) y no
# depende de la arquitectura, asi que se construye en x86 y corre en arm64.
#
# Uso:  npm ci && npm run build && docker build --platform linux/arm64 -t <repo>:<tag> .
#
# Variables al arrancar (sin BACKOFFICE_URL y STORE_KEY el proceso no levanta):
#   BACKOFFICE_URL  URL del backend del ecommerce por red privada
#   STORE_KEY       secreto: el mismo valor que APP_STORE_KEY_PEDROLLO del backend
#   MP_PUBLIC_KEY   clave publica de Mercado Pago (no es secreta)
#   PORT            puerto de escucha (4000 por omision)
# ============================================================
FROM node:24-alpine

# Deliberadamente SIN instrucciones RUN (build cruzado sin emulacion). El usuario
# 'node' ya existe en la imagen base.
WORKDIR /app
ENV NODE_ENV=production PORT=4000

# server/ es el proceso; browser/ son los estaticos que sirve (incluye public/media,
# que hoy es casi todo el peso de la imagen).
COPY --chown=node:node dist/bsv-tienda-angular/server ./server
COPY --chown=node:node dist/bsv-tienda-angular/browser ./browser

USER node
EXPOSE 4000

ENTRYPOINT ["node", "server/server.mjs"]
