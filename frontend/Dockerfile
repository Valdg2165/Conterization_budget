# syntax=docker/dockerfile:1

# ── Stage 1: development (Vite dev server + bind mount for hot reload) ─────────
FROM node:22.14-alpine3.21 AS development
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package.json ./
# npm install (not ci) so platform-specific native bindings resolve for Linux/musl
RUN npm install

COPY . .
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD nc -z localhost 5173 || exit 1

CMD ["npm", "run", "dev"]

# ── Stage 2: build static assets ──────────────────────────────────────────────
FROM node:22.14-alpine3.21 AS build
WORKDIR /app
ARG VITE_AUTH_API_URL=http://localhost:3001
ARG VITE_POWENS_API_URL=http://localhost:3003
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_POWENS_API_URL=$VITE_POWENS_API_URL
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Stage 3: production (nginx) ───────────────────────────────────────────────
FROM nginx:1.27.0-alpine3.19 AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
  && chown -R appuser:appgroup /usr/share/nginx/html \
  && chown -R appuser:appgroup /var/cache/nginx \
  && chown -R appuser:appgroup /var/log/nginx \
  && touch /var/run/nginx.pid \
  && chown appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD nginx -t || exit 1
