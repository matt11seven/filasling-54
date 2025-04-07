
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
fi

# Definir variáveis padrão se não estiverem definidas
DB_HOST=${DB_POSTGRESDB_HOST:-localhost}
DB_PORT=${DB_POSTGRESDB_PORT:-5432}
DB_USER=${DB_POSTGRESDB_USER:-postgres}
DB_PASSWORD=${DB_POSTGRESDB_PASSWORD:-postgres}
DB_NAME=${DB_POSTGRESDB_DATABASE:-slingfila}

echo -e "${YELLOW}Conectando ao PostgreSQL:${NC}"
echo -e "Host: ${DB_HOST}"
echo -e "Port: ${DB_PORT}"
echo -e "User: ${DB_USER}"
echo -e "Database: ${DB_NAME}"

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

