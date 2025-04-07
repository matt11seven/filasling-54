
#!/bin/bash

# Script para inicializar o banco de dados PostgreSQL
# Executa os scripts SQL de criação de tabelas e inserção de dados

# Cores para saída
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Inicializando Banco de Dados PostgreSQL ===${NC}"

# Carregar variáveis de ambiente se existir .env
if [ -f .env ]; then
    echo -e "${GREEN}Carregando variáveis de ambiente do arquivo .env${NC}"
    export $(grep -v '^#' .env | xargs)
else
    echo -e "${YELLOW}Arquivo .env não encontrado, usando variáveis de ambiente do sistema${NC}"
fi

# Definir variáveis padrão se não estiverem definidas
DB_HOST=${DB_POSTGRESDB_HOST:-localhost}
DB_PORT=${DB_POSTGRESDB_PORT:-5432}
DB_USER=${DB_POSTGRESDB_USER:-postgres}
DB_PASSWORD=${DB_POSTGRESDB_PASSWORD:-postgres}
DB_NAME=${DB_POSTGRESDB_DATABASE:-slingfila}

echo -e "${YELLOW}Conectando ao PostgreSQL com as seguintes configurações:${NC}"
echo -e "Host: ${DB_HOST}"
echo -e "Port: ${DB_PORT}"
echo -e "User: ${DB_USER}"
echo -e "Database: ${DB_NAME}"
echo -e "Senha: ${DB_PASSWORD:0:1}*******" # Mostra apenas o primeiro caractere por segurança

# Testar conexão antes de prosseguir
echo -e "${YELLOW}Testando conexão com o banco de dados...${NC}"
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c '\l' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Conexão com o banco de dados estabelecida com sucesso${NC}"
else
    echo -e "${RED}✗ Não foi possível conectar ao banco de dados${NC}"
    echo -e "${YELLOW}Verifique se:${NC}"
    echo -e "  1. O servidor PostgreSQL está em execução no host $DB_HOST"
    echo -e "  2. A porta $DB_PORT está aberta e acessível"
    echo -e "  3. O usuário $DB_USER existe e tem permissão para conectar"
    echo -e "  4. A senha está correta"
    echo -e "  5. Não há firewall ou regras de rede bloqueando a conexão"
    
    # Tentar obter mais informações sobre o erro
    echo -e "${YELLOW}Detalhes do erro:${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c '\l' 2>&1
    
    echo -e "${YELLOW}Verificando resolução DNS para o host:${NC}"
    host $DB_HOST 2>&1 || nslookup $DB_HOST 2>&1 || echo "Ferramentas de resolução DNS não disponíveis"
    
    exit 1
fi

# Verificar se o banco de dados existe, caso contrário criar
echo -e "${YELLOW}Verificando se o banco de dados existe...${NC}"
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${GREEN}✓ Banco de dados $DB_NAME já existe${NC}"
else
    echo -e "${YELLOW}Criando banco de dados $DB_NAME...${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Banco de dados $DB_NAME criado com sucesso${NC}"
    else
        echo -e "${RED}✗ Erro ao criar banco de dados $DB_NAME${NC}"
        exit 1
    fi
fi

# Executar script de criação de tabelas
echo -e "${YELLOW}Criando tabelas...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f init-scripts/01-create-tables.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Tabelas criadas com sucesso${NC}"
else
    echo -e "${RED}✗ Erro ao criar tabelas${NC}"
    exit 1
fi

# Executar script de inserção de dados
echo -e "${YELLOW}Inserindo dados iniciais...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f init-scripts/02-insert-default-data.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dados inseridos com sucesso${NC}"
else
    echo -e "${RED}✗ Erro ao inserir dados${NC}"
    exit 1
fi

echo -e "${GREEN}=== Banco de dados inicializado com sucesso ===${NC}"
echo -e "${YELLOW}Você pode acessar o sistema com:${NC}"
echo -e "Email: matt@slingbr.com"
echo -e "Senha: admin123"
echo -e ""
echo -e "${YELLOW}Ou com:${NC}"
echo -e "Email: admin@example.com"
echo -e "Senha: admin123"
