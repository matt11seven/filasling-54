
# Build stage para o frontend
FROM node:18-alpine as frontend-build

WORKDIR /app
COPY package*.json ./
RUN npm ci

# Copy the frontend code
COPY . .

# Build the frontend application
RUN npm run build

# Stage para Python e Nginx
FROM python:3.11-slim

# Instalar nginx e outras ferramentas necessárias
RUN apt-get update && apt-get install -y \
    nginx \
    postgresql-client \
    curl \
    gettext \
    procps \
    iputils-ping \
    dnsutils \
    netcat-openbsd \
    supervisor \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiar os arquivos estáticos do frontend
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Configurar diretórios de trabalho para o backend
WORKDIR /app

# Copiar os arquivos do backend
COPY ./backend /app

# Instalar as dependências do Python backend
RUN pip install --no-cache-dir -r requirements.txt

# Adicionar configuração do Nginx
COPY ./nginx-mono.conf /etc/nginx/conf.d/default.conf

# Copiar script de ambiente
COPY ./mono-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Configurar supervisord
COPY ./supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Verificação de saúde
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Expor portas para Nginx e FastAPI
EXPOSE 80 8000

# Iniciar supervisord para gerenciar Nginx e FastAPI
CMD ["/usr/local/bin/entrypoint.sh"]
