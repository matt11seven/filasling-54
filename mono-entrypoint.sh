#!/bin/bash
set -e

# Função para log
log_message() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_message "🚀 Iniciando contêiner monolítico FilaSling"

# Verificar os arquivos do frontend
log_message "🔍 Verificando arquivos do frontend..."
ls -la /usr/share/nginx/html
if [ ! -f "/usr/share/nginx/html/index.html" ]; then
  log_message "⚠️ AVISO: index.html não encontrado, criando arquivo mínimo para teste"
  cat > /usr/share/nginx/html/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>FilaSling - Teste</title>
</head>
<body>
    <h1>FilaSling - Teste de Integração</h1>
    <p>Se você está vendo esta página, o Nginx está funcionando corretamente!</p>
    <button onclick="testApi()">Testar API</button>
    <div id="api-result"></div>
    
    <script>
        async function testApi() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                document.getElementById('api-result').innerHTML = 
                    `API respondeu: ${JSON.stringify(data)}`;
            } catch (error) {
                document.getElementById('api-result').innerHTML = 
                    `Erro: ${error.message}`;
            }
        }
    </script>
</body>
</html>
EOF
fi

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
# Usar o domínio do EasyPanel se estiver definido
log_message "🔍 Detectando domínio e ambiente..."

# Determinar URL da API com base no ambiente
if [[ "${ENVIRONMENT}" == "production" ]]; then
  DEFAULT_API_URL="https://ops-aux-seridofila.waxfyw.easypanel.host/api"
  log_message "🌐 Ambiente de produção detectado, usando URL: ${DEFAULT_API_URL}"
else
  DEFAULT_API_URL="http://localhost/api"
  log_message "🔗 Ambiente de desenvolvimento detectado, usando URL: ${DEFAULT_API_URL}"
fi

# Criar arquivo de configuração
cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV = {
  VITE_API_URL: "${VITE_API_URL:-${DEFAULT_API_URL}}",
  ENVIRONMENT: "${ENVIRONMENT:-production}"
};
console.log('Configuração de ambiente carregada:', window.ENV);
EOF

log_message "✅ Arquivo de configuração criado com URL da API: ${VITE_API_URL:-${DEFAULT_API_URL}}"

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
