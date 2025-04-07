
#!/bin/bash

echo "============================================"
echo "Iniciando script de configuração de ambiente"
echo "============================================"
echo "Versão do script: 1.1"
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
  else
    echo "✅ Variável $var está definida"
  fi
done

echo "============================================"
echo "Substituindo placeholders nas variáveis de ambiente"
echo "============================================"

# Substitui as variáveis de ambiente nos arquivos JavaScript
echo "Procurando por arquivos JS para substituir placeholders..."
JS_FILES=$(find /usr/share/nginx/html -type f -name "*.js" | wc -l)
echo "Encontrados $JS_FILES arquivos JavaScript"

find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_HOST_PLACEHOLDER\"|\"${DB_HOST}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_USER_PLACEHOLDER\"|\"${DB_USER}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_PASSWORD_PLACEHOLDER\"|\"${DB_PASSWORD}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_NAME_PLACEHOLDER\"|\"${DB_NAME}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_PORT_PLACEHOLDER\"|\"${DB_PORT}\"|g" {} \;

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
  echo "Iniciando diagnóstico..."
  
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
    else
      echo "❌ Porta ${DB_PORT} não está acessível no host alternativo ${MODIFIED_HOST}"
    fi
  fi
  
  echo "⚠️ Verifique suas variáveis de ambiente e a conectividade com o banco de dados."
  echo "IMPORTANTE: A aplicação pode funcionar em modo offline/simulação, mas a funcionalidade será limitada."
fi

echo "============================================"
echo "Configuração de ambiente concluída"
echo "============================================"
echo "Iniciando NGINX..."
