
#!/bin/bash

# Substitui as variáveis de ambiente nos arquivos JavaScript
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"SUPABASE_URL_PLACEHOLDER\"|\"${SUPABASE_URL}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"SUPABASE_ANON_KEY_PLACEHOLDER\"|\"${SUPABASE_ANON_KEY}\"|g" {} \;

# Se houver mais variáveis de ambiente, adicione-as aqui

echo "Variáveis de ambiente substituídas com sucesso!"
