
#!/bin/bash

echo "============================================"
echo "Iniciando script de configuração de ambiente"
echo "============================================"
echo "Versão do script: 1.2"
echo "Data de execução: $(date)"

# Exibe informações do ambiente para diagnóstico
echo "Informações do ambiente:"
echo "- Sistema operacional: $(uname -a)"
echo "- Diretório atual: $(pwd)"
echo "- Conteúdo do diretório de arquivos estáticos:"
ls -la /usr/share/nginx/html

# Verifica se as variáveis foram definidas
echo "Verificando variáveis de ambiente:"
for var in DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME; do
  if [ -z "${!var}" ]; then
    echo "⚠️ ALERTA: A variável $var não está definida!"
    
    # Valores padrão se não estiverem definidos
    case "$var" in
      DB_HOST)
        export DB_HOST="localhost"
        echo "⚠️ Usando valor padrão para DB_HOST: localhost"
        ;;
      DB_PORT)
        export DB_PORT="5432"
        echo "⚠️ Usando valor padrão para DB_PORT: 5432"
        ;;
      DB_USER)
        export DB_USER="postgres"
        echo "⚠️ Usando valor padrão para DB_USER: postgres"
        ;;
      DB_PASSWORD)
        export DB_PASSWORD="postgres"
        echo "⚠️ Usando valor padrão para DB_PASSWORD: postgres"
        ;;
      DB_NAME)
        export DB_NAME="slingfila"
        echo "⚠️ Usando valor padrão para DB_NAME: slingfila"
        ;;
    esac
  else
    echo "✅ Variável $var está definida: ${!var}"
  fi
done

echo "============================================"
echo "Substituindo placeholders nas variáveis de ambiente"
echo "============================================"

# Substitui as variáveis de ambiente nos arquivos JavaScript
echo "Procurando por arquivos JS para substituir placeholders..."
JS_FILES=$(find /usr/share/nginx/html -type f -name "*.js" | wc -l)
echo "Encontrados $JS_FILES arquivos JavaScript"

# Função para registrar cada substituição
log_replacement() {
  local placeholder=$1
  local value=$2
  local file=$3
  
  echo "  - Substituindo $placeholder em $file"
}

# Executa as substituições com logs aprimorados
for js_file in $(find /usr/share/nginx/html -type f -name "*.js"); do
  # Verificando cada arquivo para placeholders
  if grep -q "DB_HOST_PLACEHOLDER" "$js_file"; then
    log_replacement "DB_HOST_PLACEHOLDER" "$DB_HOST" "$js_file"
    sed -i "s|\"DB_HOST_PLACEHOLDER\"|\"${DB_HOST}\"|g" "$js_file"
  fi
  
  if grep -q "DB_USER_PLACEHOLDER" "$js_file"; then
    log_replacement "DB_USER_PLACEHOLDER" "$DB_USER" "$js_file"
    sed -i "s|\"DB_USER_PLACEHOLDER\"|\"${DB_USER}\"|g" "$js_file"
  fi
  
  if grep -q "DB_PASSWORD_PLACEHOLDER" "$js_file"; then
    log_replacement "DB_PASSWORD_PLACEHOLDER" "********" "$js_file"
    sed -i "s|\"DB_PASSWORD_PLACEHOLDER\"|\"${DB_PASSWORD}\"|g" "$js_file"
  fi
  
  if grep -q "DB_NAME_PLACEHOLDER" "$js_file"; then
    log_replacement "DB_NAME_PLACEHOLDER" "$DB_NAME" "$js_file"
    sed -i "s|\"DB_NAME_PLACEHOLDER\"|\"${DB_NAME}\"|g" "$js_file"
  fi
  
  if grep -q "DB_PORT_PLACEHOLDER" "$js_file"; then
    log_replacement "DB_PORT_PLACEHOLDER" "$DB_PORT" "$js_file"
    sed -i "s|\"DB_PORT_PLACEHOLDER\"|\"${DB_PORT}\"|g" "$js_file"
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

PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -p "${DB_PORT}" -c "SELECT 1" > /dev/null 2>&1
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
  timeout 5 bash -c "cat < /dev/null > /dev/tcp/${DB_HOST}/${DB_PORT}" 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "✅ Porta ${DB_PORT} está acessível no host ${DB_HOST}"
  else
    echo "❌ Porta ${DB_PORT} não está acessível no host ${DB_HOST}"
  fi
  
  # Se o hostname tiver underscore, tenta convertê-lo para hífen
  if [[ "${DB_HOST}" == *"_"* ]]; then
    MODIFIED_HOST="${DB_HOST//_/-}"
    echo "Hostname contém underscore. Tentando resolução com hífens: ${MODIFIED_HOST}"
    getent hosts "${MODIFIED_HOST}" || echo "❌ Não foi possível resolver hostname modificado: ${MODIFIED_HOST}"
    
    # Teste de conectividade com hostname modificado
    timeout 5 bash -c "cat < /dev/null > /dev/tcp/${MODIFIED_HOST}/${DB_PORT}" 2>/dev/null
    if [ $? -eq 0 ]; then
      echo "✅ Porta ${DB_PORT} está acessível no host alternativo ${MODIFIED_HOST}"
      echo "⚠️ Considere usar o hostname com hífens (${MODIFIED_HOST}) em vez de underscores."
      
      # Oferece a opção de usar o hostname modificado
      echo "Deseja usar o hostname modificado (${MODIFIED_HOST}) para esta sessão? (s/n)"
      read -r USE_MODIFIED
      if [[ "$USE_MODIFIED" == "s" || "$USE_MODIFIED" == "S" ]]; then
        echo "Usando hostname modificado ${MODIFIED_HOST} para esta sessão"
        export DB_HOST="${MODIFIED_HOST}"
        
        # Refaz a substituição nos arquivos JS
        for js_file in $(find /usr/share/nginx/html -type f -name "*.js"); do
          if grep -q "\"${DB_HOST//-/_}\"" "$js_file"; then
            echo "Substituindo hostname com underscore pelo modificado em $js_file"
            sed -i "s|\"${DB_HOST//-/_}\"|\"${MODIFIED_HOST}\"|g" "$js_file"
          fi
        done
      fi
    else
      echo "❌ Porta ${DB_PORT} não está acessível no host alternativo ${MODIFIED_HOST}"
    fi
  fi
  
  # Testar conexão com credenciais explícitas
  echo "Tentando conexão com parâmetros explícitos:"
  PGPASSWORD="${DB_PASSWORD}" psql "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}" -c "SELECT 1" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ Conexão com URI explícita funcionou! Use esta configuração em seus scripts."
  else
    echo "❌ Conexão com URI explícita também falhou."
  fi
  
  echo "⚠️ Verifique suas variáveis de ambiente e a conectividade com o banco de dados."
  echo "IMPORTANTE: A aplicação pode funcionar em modo offline/simulação, mas a funcionalidade será limitada."
fi

echo "============================================"
echo "Configuração de ambiente concluída"
echo "============================================"
echo "Iniciando NGINX..."
