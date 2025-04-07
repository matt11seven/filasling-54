
#!/bin/sh

echo "============================================"
echo "Iniciando script de configuração de ambiente"
echo "============================================"
echo "Versão do script: 3.0"
echo "Data de execução: $(date)"

# Exibe informações do ambiente para diagnóstico
echo "Informações do ambiente:"
echo "- Sistema operacional: $(uname -a)"
echo "- Diretório atual: $(pwd)"
echo "- Conteúdo do diretório de arquivos estáticos:"
ls -la /usr/share/nginx/html

# Função para definir valores padrão
set_default() {
  var_name=$1
  default_value=$2
  
  eval current_value=\$${var_name}
  
  if [ -z "$current_value" ]; then
    eval $var_name=$default_value
    echo "⚠️ Usando valor padrão para $var_name: $default_value"
  else
    if [ "$var_name" = "DB_PASSWORD" ]; then
      echo "✅ Variável $var_name está definida: ********"
    else
      eval echo "✅ Variável $var_name está definida: \$$var_name"
    fi
  fi
}

# Verificar variáveis de ambiente
echo "Verificando variáveis de ambiente:"
set_default "DB_HOST" "localhost"
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

# Substitui cada placeholder nos arquivos JS
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

# Validação rápida das substituições
echo "Validando substituições (buscando placeholders não substituídos):"
PLACEHOLDERS_LEFT=$(grep -r "DB_.*_PLACEHOLDER" /usr/share/nginx/html --include="*.js" | wc -l)
if [ $PLACEHOLDERS_LEFT -eq 0 ]; then
  echo "✅ Todos os placeholders foram substituídos com sucesso!"
else
  echo "⚠️ Ainda existem $PLACEHOLDERS_LEFT placeholders não substituídos!"
  echo "Exemplos:"
  grep -r "DB_.*_PLACEHOLDER" /usr/share/nginx/html --include="*.js" | head -5
fi

echo "============================================"
echo "Testando conexão com o banco de dados PostgreSQL"
echo "============================================"
echo "Configuração a ser testada:"
echo "- Host: ${DB_HOST}"
echo "- Porta: ${DB_PORT}"
echo "- Usuário: ${DB_USER}"
echo "- Banco: ${DB_NAME}"

# Usando PGPASSWORD para evitar problemas de interpolação
export PGPASSWORD="${DB_PASSWORD}"

if command -v psql >/dev/null 2>&1; then
  psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -p "${DB_PORT}" -c "SELECT 1" >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ Conexão com o banco de dados PostgreSQL estabelecida com sucesso!"
  else
    echo "⚠️ Não foi possível conectar ao banco de dados PostgreSQL."
    echo "Iniciando diagnóstico aprofundado..."
    
    # Teste de resolução de DNS
    echo "Teste de DNS para ${DB_HOST}:"
    getent hosts "${DB_HOST}" || echo "❌ Não foi possível resolver o hostname: ${DB_HOST}"
    
    # Teste de conectividade com a porta
    echo "Teste de conectividade para ${DB_HOST}:${DB_PORT}:"
    timeout 5 sh -c "cat < /dev/null > /dev/tcp/${DB_HOST}/${DB_PORT}" 2>/dev/null
    if [ $? -eq 0 ]; then
      echo "✅ Porta ${DB_PORT} está acessível no host ${DB_HOST}"
    else
      echo "❌ Porta ${DB_PORT} não está acessível no host ${DB_HOST}"
    fi
    
    echo "⚠️ Verifique suas variáveis de ambiente e a conectividade com o banco de dados."
    echo "IMPORTANTE: A aplicação pode funcionar em modo offline/simulação, mas a funcionalidade será limitada."
  fi
else
  echo "⚠️ Cliente PostgreSQL (psql) não encontrado. Verificações de conexão ao banco de dados indisponíveis."
  echo "IMPORTANTE: Certifique-se de que a aplicação está configurada para operar em modo offline."
fi

echo "============================================"
echo "Configuração de ambiente concluída"
echo "============================================"
echo "Iniciando NGINX..."
