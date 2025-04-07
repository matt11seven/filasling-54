
#!/bin/bash

# Exibe informações de configuração
echo "Configurando variáveis de ambiente..."
echo "Tipo de banco: ${DB_TYPE:-não definido}"
echo "Host do banco: ${DB_POSTGRESDB_HOST:-não definido}"
echo "Porta do banco: ${DB_POSTGRESDB_PORT:-não definido}"
echo "Banco de dados: ${DB_POSTGRESDB_DATABASE:-não definido}"
echo "Usuário do banco: ${DB_POSTGRESDB_USER:-não definido}"
echo "Senha definida: ${DB_POSTGRESDB_PASSWORD:+sim}"

# Detectar se estamos em ambiente Docker/container
IS_DOCKER=false
if [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null; then
    IS_DOCKER=true
    echo "✅ Ambiente Docker/Container detectado"
fi

# Verificar se o hostname contém underscores (que podem causar problemas de DNS)
if [[ "$DB_POSTGRESDB_HOST" == *"_"* ]]; then
    echo "⚠️ ATENÇÃO: O hostname do banco de dados contém underscores: $DB_POSTGRESDB_HOST"
    
    if [ "$IS_DOCKER" = true ]; then
        echo "✅ Como estamos em ambiente Docker, underscores em hostnames geralmente são válidos"
        echo "✅ Docker usa sua própria resolução de nomes de serviços que suporta underscores"
    else
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
        
        # Método 5 - Substituir underscore por hífen para tentar
        HYPHEN_HOST="${DB_POSTGRESDB_HOST//_/-}"
        if [ "$HYPHEN_HOST" != "$DB_POSTGRESDB_HOST" ]; then
            echo "Testando hostname alternativo (underscores substituídos por hífens): $HYPHEN_HOST"
            # Tentar resolver esse hostname alternativo
            if command -v dig &> /dev/null; then
                IP_ALT=$(dig +short "$HYPHEN_HOST" 2>/dev/null | head -1)
                if [ ! -z "$IP_ALT" ]; then
                    echo "✅ Endereço IP resolvido para versão com hífens: $IP_ALT"
                    if [ -z "$IP_RESOLVED" ]; then
                        IP_RESOLVED=$IP_ALT
                    fi
                fi
            fi
        fi
        
        # Se conseguiu resolver, sugere usar o IP diretamente
        if [ ! -z "$IP_RESOLVED" ]; then
            echo "✅ Hostname resolvido para o IP: $IP_RESOLVED"
            echo "Recomendação: Considere usar o endereço IP diretamente no arquivo .env para evitar problemas de DNS."
            
            # Perguntar ao usuário se quer substituir automaticamente o hostname pelo IP
            if [ -t 0 ]; then  # Verifica se o script está sendo executado em um terminal interativo
                read -p "Substituir automaticamente o hostname pelo IP resolvido? (s/n): " REPLACE_HOST
                if [[ "$REPLACE_HOST" == "s" || "$REPLACE_HOST" == "S" ]]; then
                    echo "Substituindo hostname pelo IP resolvido..."
                    DB_POSTGRESDB_HOST=$IP_RESOLVED
                    echo "Host do banco substituído automaticamente pelo IP: $DB_POSTGRESDB_HOST"
                fi
            else
                # Em ambiente não interativo, informamos que a substituição pode ser feita manualmente
                echo "⚠️ Para usar o IP automaticamente, edite seu arquivo .env e substitua:"
                echo "DB_POSTGRESDB_HOST=$DB_POSTGRESDB_HOST"
                echo "Por:"
                echo "DB_POSTGRESDB_HOST=$IP_RESOLVED"
            fi
        else
            echo "❌ Não foi possível resolver o hostname para um IP. Isso pode causar problemas de conexão."
        fi
    fi
fi

# Testar conexão com o banco antes de substituir variáveis
if [ ! -z "$DB_POSTGRESDB_HOST" ] && [ ! -z "$DB_POSTGRESDB_USER" ]; then
    echo "Testando conexão com o banco de dados PostgreSQL..."
    
    # Adicionar opção de timeout para evitar que o script fique preso
    if PGPASSWORD=$DB_POSTGRESDB_PASSWORD psql -h $DB_POSTGRESDB_HOST -p ${DB_POSTGRESDB_PORT:-5432} -U $DB_POSTGRESDB_USER -d ${DB_POSTGRESDB_DATABASE:-postgres} -c '\l' -v VERBOSITY=terse -t -q > /dev/null 2>&1; then
        echo "✅ Conexão com o banco de dados PostgreSQL bem-sucedida!"
        
        # Verificar se estamos em ambiente Docker
        if [ "$IS_DOCKER" = true ]; then
            echo "INFO: Executando em ambiente Docker com hostname: $DB_POSTGRESDB_HOST"
            
            # Em Docker, podemos tentar simplificar o hostname para o nome do serviço apenas
            if [[ "$DB_POSTGRESDB_HOST" == *"."* ]]; then
                SERVICE_NAME=$(echo "$DB_POSTGRESDB_HOST" | cut -d '.' -f 1)
                echo "INFO: Nome do serviço extraído: $SERVICE_NAME"
                
                # Testar conexão com o nome simplificado do serviço
                if PGPASSWORD=$DB_POSTGRESDB_PASSWORD psql -h $SERVICE_NAME -p ${DB_POSTGRESDB_PORT:-5432} -U $DB_POSTGRESDB_USER -d ${DB_POSTGRESDB_DATABASE:-postgres} -c '\l' > /dev/null 2>&1; then
                    echo "✅ Conexão também funciona com nome simplificado do serviço: $SERVICE_NAME"
                fi
            fi
        fi
    else
        echo "❌ FALHA na conexão com o banco de dados PostgreSQL"
        
        # Verificar se estamos em ambiente Docker
        if [ "$IS_DOCKER" = true ]; then
            echo "⚠️ Tentando abordagens alternativas para ambiente Docker..."
            
            # Em Docker, tentar nome simples do serviço (sem domínio)
            if [[ "$DB_POSTGRESDB_HOST" == *"."* ]]; then
                SERVICE_NAME=$(echo "$DB_POSTGRESDB_HOST" | cut -d '.' -f 1)
                echo "Tentando conectar usando apenas nome do serviço: $SERVICE_NAME"
                
                if PGPASSWORD=$DB_POSTGRESDB_PASSWORD psql -h $SERVICE_NAME -p ${DB_POSTGRESDB_PORT:-5432} -U $DB_POSTGRESDB_USER -d ${DB_POSTGRESDB_DATABASE:-postgres} -c '\l' > /dev/null 2>&1; then
                    echo "✅ Conexão bem-sucedida usando nome simples do serviço: $SERVICE_NAME"
                    echo "Recomendação: Considere usar '$SERVICE_NAME' como hostname no seu .env"
                    
                    # Usar o nome do serviço para o restante da execução
                    DB_POSTGRESDB_HOST_ORIGINAL=$DB_POSTGRESDB_HOST
                    DB_POSTGRESDB_HOST=$SERVICE_NAME
                    echo "Usando nome simplificado do serviço ($DB_POSTGRESDB_HOST) para o restante da execução"
                else
                    echo "❌ Falha na conexão usando nome do serviço"
                fi
            fi
            
            # Tentar 'localhost' dentro do Docker
            echo "Tentando conectar usando 'localhost' dentro do Docker..."
            if PGPASSWORD=$DB_POSTGRESDB_PASSWORD psql -h localhost -p ${DB_POSTGRESDB_PORT:-5432} -U $DB_POSTGRESDB_USER -d ${DB_POSTGRESDB_DATABASE:-postgres} -c '\l' > /dev/null 2>&1; then
                echo "✅ Conexão bem-sucedida usando 'localhost'"
                echo "Recomendação: Considere usar 'localhost' como hostname no seu .env"
            else
                echo "❌ Falha na conexão usando 'localhost'"
            fi
            
            # Tentar 'postgres' (nome comum para o serviço PostgreSQL)
            echo "Tentando conectar usando 'postgres' como hostname..."
            if PGPASSWORD=$DB_POSTGRESDB_PASSWORD psql -h postgres -p ${DB_POSTGRESDB_PORT:-5432} -U $DB_POSTGRESDB_USER -d ${DB_POSTGRESDB_DATABASE:-postgres} -c '\l' > /dev/null 2>&1; then
                echo "✅ Conexão bem-sucedida usando 'postgres' como hostname"
                echo "Recomendação: Considere usar 'postgres' como hostname no seu .env"
            else
                echo "❌ Falha na conexão usando 'postgres' como hostname"
            fi
            
            # Tentar 'db' (outro nome comum para o serviço de banco de dados)
            echo "Tentando conectar usando 'db' como hostname..."
            if PGPASSWORD=$DB_POSTGRESDB_PASSWORD psql -h db -p ${DB_POSTGRESDB_PORT:-5432} -U $DB_POSTGRESDB_USER -d ${DB_POSTGRESDB_DATABASE:-postgres} -c '\l' > /dev/null 2>&1; then
                echo "✅ Conexão bem-sucedida usando 'db' como hostname"
                echo "Recomendação: Considere usar 'db' como hostname no seu .env"
            else
                echo "❌ Falha na conexão usando 'db' como hostname"
            fi
        else
            echo "Detalhes do erro:"
            PGPASSWORD=$DB_POSTGRESDB_PASSWORD psql -h $DB_POSTGRESDB_HOST -p ${DB_POSTGRESDB_PORT:-5432} -U $DB_POSTGRESDB_USER -d ${DB_POSTGRESDB_DATABASE:-postgres} -c '\l' 2>&1
            
            echo "Verificando resolução de DNS para o host: $DB_POSTGRESDB_HOST"
            host $DB_POSTGRESDB_HOST 2>&1 || nslookup $DB_POSTGRESDB_HOST 2>&1 || echo "Ferramentas de resolução DNS não disponíveis"
            
            # Tentar conexão com o IP resolvido, se disponível
            if [ ! -z "$IP_RESOLVED" ]; then
                echo "Tentando conexão usando o IP resolvido ($IP_RESOLVED) em vez do hostname..."
                if PGPASSWORD=$DB_POSTGRESDB_PASSWORD psql -h $IP_RESOLVED -p ${DB_POSTGRESDB_PORT:-5432} -U $DB_POSTGRESDB_USER -d ${DB_POSTGRESDB_DATABASE:-postgres} -c '\l' > /dev/null 2>&1; then
                    echo "✅ Conexão usando IP direto bem-sucedida!"
                    echo "Recomendação: Use o IP $IP_RESOLVED em vez do hostname no seu arquivo .env"
                    
                    # Usar o IP resolvido para o resto do script
                    DB_POSTGRESDB_HOST_ORIGINAL=$DB_POSTGRESDB_HOST
                    DB_POSTGRESDB_HOST=$IP_RESOLVED
                    echo "Usando IP resolvido ($DB_POSTGRESDB_HOST) para o restante da execução"
                else
                    echo "❌ Também falhou usando o IP resolvido. Problema deve ser outro."
                fi
            fi
        fi
        
        echo "ATENÇÃO: A aplicação tentará iniciar, mas a conexão com o banco pode falhar em runtime!"
    fi
else
    echo "⚠️ Configuração incompleta de banco de dados. Alguns parâmetros estão faltando."
fi

# Verificar se as variáveis estão definidas antes de tentar a substituição
if [ -z "$DB_POSTGRESDB_HOST" ]; then
    echo "❌ ERRO CRÍTICO: A variável DB_POSTGRESDB_HOST não está definida!"
    echo "   Isso causará problemas de conexão. Verifique seu arquivo .env"
fi

# Flag para indicar se estamos em ambiente Docker
IS_DOCKER_ENV="false"
if [ "$IS_DOCKER" = true ]; then
    IS_DOCKER_ENV="true"
    echo "Adicionando flag de ambiente Docker: $IS_DOCKER_ENV"
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
# Adicionar flag de ambiente Docker
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|\"IS_DOCKER_ENV_PLACEHOLDER\"|${IS_DOCKER_ENV}|g" {} \;

echo "Variáveis de ambiente substituídas com sucesso!"
echo "Configuração final que será usada pela aplicação:"
echo "POSTGRES_HOST: ${DB_POSTGRESDB_HOST:-não definido}"
echo "POSTGRES_PORT: ${DB_POSTGRESDB_PORT:-não definido}"
echo "POSTGRES_DB: ${DB_POSTGRESDB_DATABASE:-não definido}"
echo "POSTGRES_USER: ${DB_POSTGRESDB_USER:-não definido}"
echo "AMBIENTE_DOCKER: ${IS_DOCKER_ENV}"

echo "Iniciando o servidor web..."
