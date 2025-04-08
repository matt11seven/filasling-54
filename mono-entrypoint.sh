#!/bin/bash
set -e

# Função para log
log_message() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_message "🚀 Iniciando contêiner monolítico FilaSling"

# Criar arquivo .env a partir das variáveis de ambiente, se não existir
if [ ! -f /app/.env ]; then
  log_message "📝 Criando arquivo .env para o backend"
  
  cat > /app/.env << EOF
# Configurações geradas automaticamente
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-filasling}

SECRET_KEY=${SECRET_KEY:-chave_secreta_padrao_temporaria_nao_usar_em_producao}
ALGORITHM=${ALGORITHM:-HS256}
ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES:-30}

API_HOST=0.0.0.0
API_PORT=8000
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-http://localhost,http://localhost:80}

ENVIRONMENT=${ENVIRONMENT:-production}
EOF
fi

# Substituir a variável de ambiente da URL da API no frontend
log_message "🔄 Configurando variáveis de ambiente para o frontend"

# Criar um arquivo de configuração dinâmico para o frontend
cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV = {
  VITE_API_URL: "${VITE_API_URL:-http://localhost/api}"
};
EOF

# Injetar o script env-config.js no index.html
if grep -q "env-config.js" /usr/share/nginx/html/index.html; then
  log_message "✅ Script de configuração já está presente no index.html"
else
  log_message "📝 Injetando script de configuração no index.html"
  sed -i 's/<head>/<head>\n  <script src="\/env-config.js"><\/script>/' /usr/share/nginx/html/index.html
fi

# Verificar conexão com o banco de dados
log_message "🔍 Verificando conexão com o banco de dados em ${DB_HOST:-postgres}:${DB_PORT:-5432}"

max_retries=30
count=0

while ! pg_isready -h ${DB_HOST:-postgres} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} > /dev/null 2>&1; do
  count=$((count+1))
  if [ $count -ge $max_retries ]; then
    log_message "❌ Não foi possível conectar ao PostgreSQL após $max_retries tentativas. Continuando mesmo assim..."
    break
  fi
  
  log_message "⏳ Esperando PostgreSQL estar disponível... ($count/$max_retries)"
  sleep 2
done

if [ $count -lt $max_retries ]; then
  log_message "✅ PostgreSQL está disponível!"
fi

# Iniciar o supervisord (vai gerenciar o nginx e o backend Python)
log_message "🚀 Iniciando serviços com supervisord"
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
