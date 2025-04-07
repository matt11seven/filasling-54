
#!/bin/bash

# Substitui as variáveis de ambiente nos arquivos JavaScript
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_HOST_PLACEHOLDER\"|\"${DB_HOST}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_USER_PLACEHOLDER\"|\"${DB_USER}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_PASSWORD_PLACEHOLDER\"|\"${DB_PASSWORD}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_NAME_PLACEHOLDER\"|\"${DB_NAME}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_PORT_PLACEHOLDER\"|\"${DB_PORT}\"|g" {} \;

echo "Variáveis de ambiente substituídas com sucesso!"

# Teste de conectividade com o banco de dados
echo "Testando conexão com o banco de dados PostgreSQL..."
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -p "${DB_PORT}" -c "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Conexão com o banco de dados PostgreSQL estabelecida com sucesso!"
else
  echo "⚠️ Não foi possível conectar ao banco de dados PostgreSQL. Detalhes da configuração:"
  echo "Host: ${DB_HOST}"
  echo "Port: ${DB_PORT}"
  echo "User: ${DB_USER}"
  echo "Database: ${DB_NAME}"
  
  # Tenta resolver o hostname com e sem underscore
  echo "Tentando resolver o hostname..."
  getent hosts "${DB_HOST}" || echo "Não foi possível resolver o hostname: ${DB_HOST}"
  
  # Se o hostname tiver underscore, tenta convertê-lo para hífen
  if [[ "${DB_HOST}" == *"_"* ]]; then
    MODIFIED_HOST="${DB_HOST//_/-}"
    echo "Hostname contém underscore. Tentando resolução com hífens: ${MODIFIED_HOST}"
    getent hosts "${MODIFIED_HOST}" || echo "Não foi possível resolver hostname modificado: ${MODIFIED_HOST}"
  fi
  
  echo "⚠️ Verifique suas variáveis de ambiente e a conectividade com o banco de dados."
fi

