
#!/bin/sh

echo "============================================"
echo "Iniciando script de configuração de ambiente"
echo "============================================"
echo "Versão do script: 5.0"
echo "Data de execução: $(date)"

# Exibe informações do ambiente para diagnóstico
echo "Informações do ambiente:"
echo "- Sistema operacional: $(uname -a)"
echo "- Diretório atual: $(pwd)"
echo "- Conteúdo do diretório de arquivos estáticos:"
ls -la /usr/share/nginx/html

# Função para definir valores padrão - compatível com sh no Alpine
set_default() {
  var_name=$1
  default_value=$2
  
  current_value=""
  eval "current_value=\${$var_name}"
  
  if [ -z "$current_value" ]; then
    # Definir valor padrão
    eval "$var_name=$default_value"
    echo "⚠️ Usando valor padrão para $var_name: $default_value"
  else
    # Exibir valor atual (exceto para senha)
    if [ "$var_name" = "DB_PASSWORD" ]; then
      echo "✅ Variável $var_name está definida: ********"
    else
      echo "✅ Variável $var_name está definida: $current_value"
    fi
  fi
}

# Verificar variáveis de ambiente com mensagens claras
echo "Verificando variáveis de ambiente:"
set_default "DB_HOST" "ops-aux_seridofila-db"
set_default "DB_PORT" "5432"
set_default "DB_USER" "postgres"
set_default "DB_PASSWORD" "postgres"
set_default "DB_NAME" "slingfila"

echo "============================================"
echo "Substituindo placeholders nas variáveis de ambiente"
echo "============================================"

# Busca todos os arquivos JS
echo "Procurando por arquivos JS para substituir placeholders..."
JS_FILES=$(find /usr/share/nginx/html -type f -name "*.js" | wc -l)
echo "Encontrados $JS_FILES arquivos JavaScript"

# Substitui cada placeholder nos arquivos JS - usando sed de forma compatível com BusyBox
for js_file in $(find /usr/share/nginx/html -type f -name "*.js"); do
  echo "Verificando arquivo: $js_file"
  
  # DB_HOST
  if grep -q "DB_HOST_PLACEHOLDER" "$js_file"; then
    echo "  - Substituindo DB_HOST_PLACEHOLDER por $DB_HOST em $js_file"
    sed -i "s|\"DB_HOST_PLACEHOLDER\"|\"$DB_HOST\"|g" "$js_file"
  fi
  
  # DB_PORT
  if grep -q "DB_PORT_PLACEHOLDER" "$js_file"; then
    echo "  - Substituindo DB_PORT_PLACEHOLDER por $DB_PORT em $js_file"
    sed -i "s|\"DB_PORT_PLACEHOLDER\"|\"$DB_PORT\"|g" "$js_file"
  fi
  
  # DB_USER
  if grep -q "DB_USER_PLACEHOLDER" "$js_file"; then
    echo "  - Substituindo DB_USER_PLACEHOLDER por $DB_USER em $js_file"
    sed -i "s|\"DB_USER_PLACEHOLDER\"|\"$DB_USER\"|g" "$js_file"
  fi
  
  # DB_PASSWORD
  if grep -q "DB_PASSWORD_PLACEHOLDER" "$js_file"; then
    echo "  - Substituindo DB_PASSWORD_PLACEHOLDER por $DB_PASSWORD em $js_file"
    sed -i "s|\"DB_PASSWORD_PLACEHOLDER\"|\"$DB_PASSWORD\"|g" "$js_file"
  fi
  
  # DB_NAME
  if grep -q "DB_NAME_PLACEHOLDER" "$js_file"; then
    echo "  - Substituindo DB_NAME_PLACEHOLDER por $DB_NAME em $js_file"
    sed -i "s|\"DB_NAME_PLACEHOLDER\"|\"$DB_NAME\"|g" "$js_file"
  fi
done

echo "Variáveis de ambiente substituídas com sucesso!"

# Validação básica das substituições
echo "Validando substituições (buscando placeholders não substituídos):"
PLACEHOLDERS_LEFT=$(find /usr/share/nginx/html -type f -name "*.js" -exec grep -l "DB_.*_PLACEHOLDER" {} \; | wc -l)

if [ $PLACEHOLDERS_LEFT -eq 0 ]; then
  echo "✅ Todos os placeholders foram substituídos com sucesso!"
else
  echo "⚠️ Ainda existem $PLACEHOLDERS_LEFT arquivos com placeholders não substituídos!"
  find /usr/share/nginx/html -type f -name "*.js" -exec grep -l "DB_.*_PLACEHOLDER" {} \; | head -5
fi

echo "============================================"
echo "Testando conexão com o banco de dados PostgreSQL"
echo "============================================"
echo "Configuração a ser testada:"
echo "- Host: ${DB_HOST}"
echo "- Porta: ${DB_PORT}"
echo "- Usuário: ${DB_USER}"
echo "- Banco: ${DB_NAME}"

# Exporta a senha para PostgreSQL
export PGPASSWORD="${DB_PASSWORD}"

# TESTE DE CONEXÃO
if command -v psql >/dev/null 2>&1; then
  # Tenta conexão básica 
  echo "Tentando conexão simples com o PostgreSQL..."
  if psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -p "${DB_PORT}" -c "SELECT 1" >/dev/null 2>&1; then
    echo "✅ Conexão com o banco de dados PostgreSQL estabelecida com sucesso!"
  else
    echo "⚠️ Não foi possível conectar ao banco de dados PostgreSQL."
    echo "Diagnosticando problema..."
    
    # Teste de ping para o host
    if ping -c 1 "${DB_HOST}" >/dev/null 2>&1; then
      echo "✅ Host ${DB_HOST} está respondendo ao ping"
    else
      echo "❌ Host ${DB_HOST} não está respondendo ao ping"
    fi
    
    # Teste de porta
    if nc -z "${DB_HOST}" "${DB_PORT}" >/dev/null 2>&1; then
      echo "✅ Porta ${DB_PORT} está aberta no host ${DB_HOST}"
    else
      echo "❌ Porta ${DB_PORT} não está acessível no host ${DB_HOST}"
    fi
    
    echo "⚠️ A aplicação funcionará em modo offline/simulação."
  fi
else
  echo "⚠️ Cliente PostgreSQL (psql) não encontrado. Verificações de conexão indisponíveis."
  echo "⚠️ A aplicação funcionará em modo offline/simulação."
fi

echo "============================================"
echo "Configuração de ambiente concluída"
echo "============================================"
echo "Iniciando NGINX..."
