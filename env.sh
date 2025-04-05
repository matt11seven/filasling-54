
#!/bin/bash

# Substitui as variáveis de ambiente nos arquivos JavaScript
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"SUPABASE_URL_PLACEHOLDER\"|\"${SUPABASE_URL}\"|g" {} \;
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"SUPABASE_ANON_KEY_PLACEHOLDER\"|\"${SUPABASE_ANON_KEY}\"|g" {} \;

# Substitui a variável VERBOSE_DEBUG, convertendo para minúsculo para garantir que seja tratado como booleano
if [ "${VERBOSE_DEBUG}" = "true" ] || [ "${VERBOSE_DEBUG}" = "TRUE" ] || [ "${VERBOSE_DEBUG}" = "1" ]; then
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|VERBOSE_DEBUG|true|g" {} \;
  echo "Modo de depuração detalhada ATIVADO"
else
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|VERBOSE_DEBUG|false|g" {} \;
  echo "Modo de depuração detalhada DESATIVADO"
fi

# Se houver mais variáveis de ambiente, adicione-as aqui

echo "Variáveis de ambiente substituídas com sucesso!"
