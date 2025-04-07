
#!/bin/bash

# Exibe informações de configuração
echo "Configurando variáveis de ambiente..."
echo "Tipo de banco: ${DB_TYPE:-não definido}"
echo "Host do banco: ${DB_POSTGRESDB_HOST:-não definido}"
echo "Porta do banco: ${DB_POSTGRESDB_PORT:-não definido}"
echo "Banco de dados: ${DB_POSTGRESDB_DATABASE:-não definido}"
echo "Usuário do banco: ${DB_POSTGRESDB_USER:-não definido}"
echo "Senha definida: ${DB_POSTGRESDB_PASSWORD:+sim}"

# Testar conexão com o banco antes de substituir variáveis
if [ ! -z "$DB_POSTGRESDB_HOST" ] && [ ! -z "$DB_POSTGRESDB_USER" ]; then
    echo "Testando conexão com o banco de dados PostgreSQL..."
    if PGPASSWORD=$DB_POSTGRESDB_PASSWORD psql -h $DB_POSTGRESDB_HOST -p ${DB_POSTGRESDB_PORT:-5432} -U $DB_POSTGRESDB_USER -d ${DB_POSTGRESDB_DATABASE:-postgres} -c '\l' > /dev/null 2>&1; then
        echo "✅ Conexão com o banco de dados PostgreSQL bem-sucedida!"
    else
        echo "❌ FALHA na conexão com o banco de dados PostgreSQL"
        echo "Detalhes do erro:"
        PGPASSWORD=$DB_POSTGRESDB_PASSWORD psql -h $DB_POSTGRESDB_HOST -p ${DB_POSTGRESDB_PORT:-5432} -U $DB_POSTGRESDB_USER -d ${DB_POSTGRESDB_DATABASE:-postgres} -c '\l' 2>&1
        
        echo "Verificando resolução de DNS para o host: $DB_POSTGRESDB_HOST"
        host $DB_POSTGRESDB_HOST 2>&1 || nslookup $DB_POSTGRESDB_HOST 2>&1 || echo "Ferramentas de resolução DNS não disponíveis"
        
        echo "ATENÇÃO: A aplicação tentará iniciar, mas a conexão com o banco pode falhar em runtime!"
    fi
else
    echo "⚠️ Configuração incompleta de banco de dados. Alguns parâmetros estão faltando."
fi

# Substitui as variáveis de ambiente nos arquivos JavaScript
echo "Substituindo variáveis de ambiente nos arquivos JavaScript..."

# Variáveis do Supabase (opcional)
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
echo "Configuração final que será usada pela aplicação:"
echo "POSTGRES_HOST: ${DB_POSTGRESDB_HOST:-não definido}"
echo "POSTGRES_PORT: ${DB_POSTGRESDB_PORT:-não definido}"
echo "POSTGRES_DB: ${DB_POSTGRESDB_DATABASE:-não definido}"
echo "POSTGRES_USER: ${DB_POSTGRESDB_USER:-não definido}"

echo "Iniciando o servidor web..."
