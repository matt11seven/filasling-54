
#!/bin/bash

# Substitui as variáveis de ambiente nos arquivos JavaScript
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"SUPABASE_URL_PLACEHOLDER\"|\"${SUPABASE_URL}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"SUPABASE_ANON_KEY_PLACEHOLDER\"|\"${SUPABASE_ANON_KEY}\"|g" {} \;

# Variáveis para PostgreSQL no formato EasyPanel
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_TYPE_PLACEHOLDER\"|\"${DB_TYPE}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_POSTGRESDB_HOST_PLACEHOLDER\"|\"${DB_POSTGRESDB_HOST}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_POSTGRESDB_USER_PLACEHOLDER\"|\"${DB_POSTGRESDB_USER}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_POSTGRESDB_PASSWORD_PLACEHOLDER\"|\"${DB_POSTGRESDB_PASSWORD}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_POSTGRESDB_DATABASE_PLACEHOLDER\"|\"${DB_POSTGRESDB_DATABASE}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_POSTGRESDB_PORT_PLACEHOLDER\"|\"${DB_POSTGRESDB_PORT}\"|g" {} \;

echo "Variáveis de ambiente substituídas com sucesso!"
