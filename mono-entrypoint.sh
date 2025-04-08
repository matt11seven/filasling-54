#!/bin/bash
set -e

# Função para log
log_message() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Função para expandir variáveis de template
expand_template_vars() {
  local input_string="$1"
  local project_name="${PROJECT_NAME:-filasling}"
  
  # Substituição de $(PROJECT_NAME)
  echo "$input_string" | sed "s/\$(PROJECT_NAME)/${project_name}/g"
}

log_message "🚀 Iniciando contêiner monolítico FilaSling"
log_message "🔍 Nome do projeto: ${PROJECT_NAME:-filasling}"

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
  
  # Define variáveis padrão baseadas no nome do projeto
  PROJECT_NAME=${PROJECT_NAME:-filasling}
  DEFAULT_DB_HOST=$(expand_template_vars "${DB_HOST:-\$(PROJECT_NAME)_postgres}")
  DEFAULT_DB_NAME=$(expand_template_vars "${DB_NAME:-\$(PROJECT_NAME)}")
  DEFAULT_DOMAIN=$(expand_template_vars "${DOMAIN:-ops-aux-\$(PROJECT_NAME).waxfyw.easypanel.host}")
  
  log_message "🔑 Usando configurações baseadas no projeto: ${PROJECT_NAME}"
  log_message "🔗 Host do banco: ${DEFAULT_DB_HOST}"
  log_message "🔗 Nome do banco: ${DEFAULT_DB_NAME}"
  log_message "🔗 Domínio: ${DEFAULT_DOMAIN}"
  
  # Cria o arquivo .env
  cat > /app/.env << EOF
# Configurações geradas automaticamente

# Configurações do banco de dados
DB_HOST=${DB_HOST:-$DEFAULT_DB_HOST}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-$DEFAULT_DB_NAME}

# Configurações JWT
SECRET_KEY=${SECRET_KEY:-"super-secret-key-muito-segura-mesmo-confia"}
ALGORITHM=${ALGORITHM:-"HS256"}
ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES:-30}

# Configurações do servidor
API_HOST=${API_HOST:-0.0.0.0}
API_PORT=${API_PORT:-8000}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-http://localhost,http://localhost:80,https://$DEFAULT_DOMAIN}

# Ambiente (development, production)
ENVIRONMENT=${ENVIRONMENT:-production}

# Domínio da aplicação
DOMAIN=${DOMAIN:-$DEFAULT_DOMAIN}
EOF

  log_message "✅ Arquivo .env criado com sucesso"
fi

# Substituir a variável de ambiente da URL da API no frontend
log_message "🔄 Configurando variáveis de ambiente para o frontend"

# Criar um arquivo de configuração dinâmico para o frontend
# Usar o domínio do EasyPanel se estiver definido
log_message "🔍 Detectando domínio e ambiente..."

# Recupera valores do domínio ou gera com base no projeto
PROJECT_NAME=${PROJECT_NAME:-filasling}
DEFAULT_DOMAIN=$(expand_template_vars "${DOMAIN:-ops-aux-\$(PROJECT_NAME).waxfyw.easypanel.host}")

# Determinar URL da API com base no ambiente
# No contêiner monolítico, sempre usamos URL relativa para API no mesmo servidor
DEFAULT_API_URL="/api"
log_message "🔗 Contêiner monolítico: usando URL relativa para API: ${DEFAULT_API_URL}"

# Usar a URL da API do ambiente se definida, ou o valor calculado
API_URL=${VITE_API_URL:-${DEFAULT_API_URL}}
log_message "🔑 URL da API final: ${API_URL}"

# Criar arquivo de configuração
cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV = {
  VITE_API_URL: "${API_URL}",
  ENVIRONMENT: "${ENVIRONMENT:-production}",
  PROJECT_NAME: "${PROJECT_NAME}",
  DOMAIN: "${DEFAULT_DOMAIN}"
};
console.log('Configuração de ambiente carregada:', window.ENV);
EOF

log_message "✅ Arquivo de configuração criado com URL da API: ${API_URL}"

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
