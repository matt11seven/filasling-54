
#!/bin/bash

# Substitui as variáveis de ambiente nos arquivos JavaScript
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"SUPABASE_URL_PLACEHOLDER\"|\"${SUPABASE_URL}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"SUPABASE_ANON_KEY_PLACEHOLDER\"|\"${SUPABASE_ANON_KEY}\"|g" {} \;

# Variáveis para PostgreSQL direto
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_HOST_PLACEHOLDER\"|\"${DB_HOST}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_USER_PLACEHOLDER\"|\"${DB_USER}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_PASSWORD_PLACEHOLDER\"|\"${DB_PASSWORD}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_NAME_PLACEHOLDER\"|\"${DB_NAME}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"DB_PORT_PLACEHOLDER\"|\"${DB_PORT}\"|g" {} \;

echo "Variáveis de ambiente substituídas com sucesso!"
