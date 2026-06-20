# ─────────────────────────────────────────────────────────────────────────
# Single-stage container: compile the React SPA and serve via Nginx.
# ─────────────────────────────────────────────────────────────────────────

# Stage 1 — build the frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2 — serve the built assets using Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
