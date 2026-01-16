# VentaMaestra 2.0 - Docker
# Nota: esto ejecuta el backend Express + archivos estáticos.

FROM node:20-alpine

WORKDIR /app

# Instala dependencias primero (mejor cache)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copia el resto del proyecto
COPY . .

# Datos persistentes (si el hosting ofrece volumen/disk)
VOLUME ["/app/data"]

ENV NODE_ENV=production

# Render/Railway/otros inyectan PORT
EXPOSE 8080

CMD ["node", "server.js"]
