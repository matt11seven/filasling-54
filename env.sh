
#!/bin/bash

# Exibe informações de configuração
echo "Configurando variáveis de ambiente..."
echo "Tipo de banco: ${DB_TYPE:-não definido}"
echo "Host do banco: ${DB_POSTGRESDB_HOST:-não definido}"
echo "Porta do banco: ${DB_POSTGRESDB_PORT:-não definido}"
echo "Banco de dados: ${DB_POSTGRESDB_DATABASE:-não definido}"
echo "Usuário do banco: ${DB_POSTGRESDB_USER:-não definido}"
echo "Senha definida: ${DB_POSTGRESDB_PASSWORD:+sim}"

# Verificar se o hostname contém underscores (que podem causar problemas de DNS)
if [[ "$DB_POSTGRESDB_HOST" == *"_"* ]]; then
    echo "⚠️ ATENÇÃO: O hostname do banco de dados contém underscores: $DB_POSTGRESDB_HOST"
    echo "⚠️ Isso pode causar problemas de resolução DNS em alguns ambientes."
    
    # Tentar resolver o hostname para IP usando diferentes métodos
    echo "Tentando resolver o hostname para endereço IP..."
    
    IP_RESOLVED=""
    
    # Método 1: usando dig
    if command -v dig &> /dev/null; then
        echo "Tentando resolver usando dig..."
        IP_DIG=$(dig +short "$DB_POSTGRESDB_HOST" 2>/dev/null | head -1)
        if [ ! -z "$IP_DIG" ]; then
            IP_RESOLVED=$IP_DIG
            echo "✅ Endereço IP resolvido usando dig: $IP_RESOLVED"
        fi
    fi
    
    # Método 2: usando host
    if [ -z "$IP_RESOLVED" ] && command -v host &> /dev/null; then
        echo "Tentando resolver usando host..."
        IP_HOST=$(host "$DB_POSTGRESDB_HOST" 2>/dev/null | grep "has address" | head -1 | awk '{print $4}')
        if [ ! -z "$IP_HOST" ]; then
            IP_RESOLVED=$IP_HOST
            echo "✅ Endereço IP resolvido usando host: $IP_RESOLVED"
        fi
    fi
    
    # Método 3: usando getent
    if [ -z "$IP_RESOLVED" ] && command -v getent &> /dev/null; then
        echo "Tentando resolver usando getent..."
        IP_GETENT=$(getent hosts "$DB_POSTGRESDB_HOST" 2>/dev/null | awk '{print $1}' | head -1)
        if [ ! -z "$IP_GETENT" ]; then
            IP_RESOLVED=$IP_GETENT
            echo "✅ Endereço IP resolvido usando getent: $IP_RESOLVED"
        fi
    fi
    
    # Método 4: usando nslookup
    if [ -z "$IP_RESOLVED" ] && command -v nslookup &> /dev/null; then
        echo "Tentando resolver usando nslookup..."
        IP_NSLOOKUP=$(nslookup "$DB_POSTGRESDB_HOST" 2>/dev/null | grep "Address:" | tail -1 | awk '{print $2}')
        if [ ! -z "$IP_NSLOOKUP" ]; then
            IP_RESOLVED=$IP_NSLOOKUP
            echo "✅ Endereço IP resolvido usando nslookup: $IP_RESOLVED"
        fi
    fi
    
    # Se conseguiu resolver, sugere usar o IP diretamente
    if [ ! -z "$IP_RESOLVED" ]; then
        echo "✅ Hostname resolvido para o IP: $IP_RESOLVED"
        echo "Recomendação: Considere usar o endereço IP diretamente no arquivo .env para evitar problemas de DNS."
        
        # Opcionalmente, você pode substituir automaticamente o hostname pelo IP
        # Descomente a linha abaixo para ativar essa funcionalidade
        # DB_POSTGRESDB_HOST=$IP_RESOLVED
        # echo "Host do banco substituído automaticamente pelo IP: $DB_POSTGRESDB_HOST"
    else
        echo "❌ Não foi possível resolver o hostname para um IP. Isso pode causar problemas de conexão."
    fi
fi

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
