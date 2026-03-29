# ============================================
# Dockerfile - Frontend React (Vite + Nginx)
# ============================================

# Étape 1: Build de l'application React
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm ci

# Copier le reste du code source
COPY . .

# Build de l'application
RUN npm run build

# Étape 2: Production avec Nginx
FROM nginx:alpine

# Copier le build depuis le builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copier le script de health check
COPY healthcheck.sh /usr/share/nginx/healthcheck.sh
RUN chmod +x /usr/share/nginx/healthcheck.sh

# Exposition du port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /usr/share/nginx/healthcheck.sh

# Démarrage de Nginx
CMD ["nginx", "-g", "daemon off;"]
