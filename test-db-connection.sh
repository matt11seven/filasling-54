
#!/bin/bash

# Script para testar a conexão com o banco de dados
# Usage: ./test-db-connection.sh

# Cores para melhor visualização
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}   Teste de Conexão com Banco de Dados       ${NC}"
echo -e "${GREEN}=============================================${NC}"

# Carrega variáveis de ambiente do .env
if [ -f ".env" ]; then
  echo -e "${YELLOW}Carregando variáveis do arquivo .env...${NC}"
  set -a
  source .env
  set +a
else
  echo -e "${RED}Arquivo .env não encontrado!${NC}"
  echo -e "${YELLOW}Por favor, crie um arquivo .env com as seguintes variáveis:${NC}"
  echo -e "${YELLOW}DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME${NC}"
  exit 1
fi

# Exibe configurações que serão usadas (sem mostrar a senha)
echo -e "${YELLOW}Configurações do banco de dados:${NC}"
echo -e "Host: ${DB_HOST}"
echo -e "Porta: ${DB_PORT}"
echo -e "Usuário: ${DB_USER}"
echo -e "Banco: ${DB_NAME}"

# Verifica se o PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
  echo -e "${RED}Comando psql não encontrado. PostgreSQL client não está instalado.${NC}"
  echo -e "${YELLOW}Por favor, instale o cliente PostgreSQL:${NC}"
  echo -e "${YELLOW}sudo apt-get install postgresql-client${NC}"
  exit 1
fi

# Testa a conexão com o banco de dados
echo -e "${YELLOW}Testando conexão...${NC}"
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -p "${DB_PORT}" -c "SELECT 'Conexão estabelecida com sucesso!' as status;" 2>/dev/null

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Conexão com o banco de dados PostgreSQL estabelecida com sucesso!${NC}"
else
  echo -e "${RED}❌ Falha ao conectar ao banco de dados.${NC}"
  echo -e "${YELLOW}Iniciando diagnóstico...${NC}"
  
  # Teste de resolução de DNS
  echo -e "${YELLOW}Teste de DNS para ${DB_HOST}:${NC}"
  getent hosts "${DB_HOST}" || echo -e "${RED}❌ Não foi possível resolver o hostname: ${DB_HOST}${NC}"
  
  # Teste de conectividade com a porta
  echo -e "${YELLOW}Teste de conectividade para ${DB_HOST}:${DB_PORT}:${NC}"
  timeout 5 bash -c "cat < /dev/null > /dev/tcp/${DB_HOST}/${DB_PORT}" 2>/dev/null
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Porta ${DB_PORT} está acessível no host ${DB_HOST}${NC}"
  else
    echo -e "${RED}❌ Porta ${DB_PORT} não está acessível no host ${DB_HOST}${NC}"
  fi
  
  # Verifique se há problemas com underscore no hostname
  if [[ "${DB_HOST}" == *"_"* ]]; then
    echo -e "${YELLOW}⚠️ Atenção: O hostname (${DB_HOST}) contém underscores, o que pode causar problemas de resolução.${NC}"
    MODIFIED_HOST="${DB_HOST//_/-}"
    echo -e "${YELLOW}Sugestão: Tente usar ${MODIFIED_HOST} em vez de ${DB_HOST}${NC}"
  fi
  
  # Verifique se as variáveis estão definidas corretamente
  if [ -z "${DB_HOST}" ] || [ -z "${DB_PORT}" ] || [ -z "${DB_USER}" ] || [ -z "${DB_PASSWORD}" ] || [ -z "${DB_NAME}" ]; then
    echo -e "${RED}⚠️ Algumas variáveis de ambiente estão vazias:${NC}"
    [ -z "${DB_HOST}" ] && echo -e "${RED}- DB_HOST não está definido${NC}"
    [ -z "${DB_PORT}" ] && echo -e "${RED}- DB_PORT não está definido${NC}"
    [ -z "${DB_USER}" ] && echo -e "${RED}- DB_USER não está definido${NC}"
    [ -z "${DB_PASSWORD}" ] && echo -e "${RED}- DB_PASSWORD não está definido${NC}"
    [ -z "${DB_NAME}" ] && echo -e "${RED}- DB_NAME não está definido${NC}"
  fi
  
  echo -e "${YELLOW}Verifique suas variáveis de ambiente e a conectividade com o banco de dados.${NC}"
fi

echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}   Teste de conexão concluído                 ${NC}"
echo -e "${GREEN}=============================================${NC}"
