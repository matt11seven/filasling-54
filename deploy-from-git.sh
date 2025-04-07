
#!/bin/bash

# Script para deploy diretamente do Git para o servidor
# Usage: ./deploy-from-git.sh <git-branch>

# Cores para melhor visualização
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}   Iniciando deploy do SlingFila via Git       ${NC}"
echo -e "${GREEN}===============================================${NC}"

# Verificar se a branch foi especificada
if [ -z "$1" ]; then
  BRANCH="main"
  echo -e "${YELLOW}Branch não especificada. Usando 'main' como padrão.${NC}"
else
  BRANCH="$1"
  echo -e "${GREEN}Branch especificada: ${BRANCH}${NC}"
fi

# Diretório de destino do deploy
DEPLOY_DIR="/opt/slingfila"
BACKUP_DIR="/opt/slingfila_backups/$(date +%Y%m%d_%H%M%S)"

# Verifica se o diretório de deploy existe
if [ ! -d "$DEPLOY_DIR" ]; then
  echo -e "${YELLOW}Diretório de deploy não encontrado. Criando...${NC}"
  mkdir -p "$DEPLOY_DIR"
fi

# Cria diretório de backup
mkdir -p "$BACKUP_DIR"

# Verificar se o diretório é um repositório Git
if [ -d "$DEPLOY_DIR/.git" ]; then
  echo -e "${GREEN}Repositório Git encontrado. Atualizando...${NC}"
  
  # Backup dos arquivos atuais
  echo -e "${YELLOW}Fazendo backup dos arquivos atuais...${NC}"
  cp -r "$DEPLOY_DIR"/* "$BACKUP_DIR" 2>/dev/null || true
  
  # Atualizar repositório
  cd "$DEPLOY_DIR" || exit 1
  echo -e "${YELLOW}Salvando alterações locais...${NC}"
  git stash -u
  
  echo -e "${YELLOW}Puxando as alterações do repositório remoto...${NC}"
  git fetch --all
  
  echo -e "${YELLOW}Alternando para a branch ${BRANCH}...${NC}"
  git checkout "$BRANCH"
  
  echo -e "${YELLOW}Atualizando a branch local...${NC}"
  git reset --hard "origin/$BRANCH"
else
  echo -e "${YELLOW}Diretório não é um repositório Git. Clonando...${NC}"
  
  # Backup dos arquivos existentes se houver
  if [ "$(ls -A "$DEPLOY_DIR")" ]; then
    echo -e "${YELLOW}Fazendo backup dos arquivos existentes...${NC}"
    cp -r "$DEPLOY_DIR"/* "$BACKUP_DIR" 2>/dev/null || true
    rm -rf "$DEPLOY_DIR"/*
  fi
  
  # Solicita a URL do repositório Git
  echo -e "${YELLOW}Por favor, forneça a URL do repositório Git:${NC}"
  read -r GIT_URL
  
  # Clona o repositório
  git clone --branch "$BRANCH" "$GIT_URL" "$DEPLOY_DIR"
  cd "$DEPLOY_DIR" || exit 1
fi

# Verifica se .env existe, caso contrário cria a partir do .env.example
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  echo -e "${YELLOW}Arquivo .env não encontrado. Criando a partir do .env.example...${NC}"
  if [ -f "$DEPLOY_DIR/.env.example" ]; then
    cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"
    echo -e "${GREEN}Arquivo .env criado. ATENÇÃO: Edite o arquivo .env com suas configurações!${NC}"
  else
    echo -e "${RED}Arquivo .env.example não encontrado. Criando .env vazio...${NC}"
    touch "$DEPLOY_DIR/.env"
    
    # Adiciona variáveis necessárias ao .env
    echo -e "# Configuração do PostgreSQL" >> "$DEPLOY_DIR/.env"
    echo -e "DB_USER=postgres" >> "$DEPLOY_DIR/.env"
    echo -e "DB_PASSWORD=postgres" >> "$DEPLOY_DIR/.env"
    echo -e "DB_NAME=slingfila" >> "$DEPLOY_DIR/.env"
    echo -e "DB_PORT=5432" >> "$DEPLOY_DIR/.env"
    echo -e "DB_HOST=localhost" >> "$DEPLOY_DIR/.env"
    
    echo -e "${YELLOW}Arquivo .env criado com valores padrão. Por favor, edite-o com seus valores reais.${NC}"
  fi
  
  # Dá tempo para o usuário editar o .env se necessário
  echo -e "${YELLOW}Deseja editar o arquivo .env agora? (s/n)${NC}"
  read -r EDIT_ENV
  if [[ "$EDIT_ENV" == "s" || "$EDIT_ENV" == "S" ]]; then
    nano "$DEPLOY_DIR/.env"
  fi
fi

# Verifica permissões dos scripts
echo -e "${YELLOW}Verificando permissões dos scripts...${NC}"
chmod +x "$DEPLOY_DIR/deploy.sh" 2>/dev/null || true
chmod +x "$DEPLOY_DIR/env.sh" 2>/dev/null || true
chmod +x "$DEPLOY_DIR/make-deploy-executable.sh" 2>/dev/null || true

# Instala dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
cd "$DEPLOY_DIR" || exit 1
npm ci

# Testa a conexão do banco antes de prosseguir
echo -e "${YELLOW}Testando conexão com o banco de dados...${NC}"
source "$DEPLOY_DIR/.env"

PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -p "${DB_PORT}" -c "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Conexão com o banco de dados PostgreSQL estabelecida com sucesso!${NC}"
else
  echo -e "${RED}⚠️ Não foi possível conectar ao banco de dados PostgreSQL.${NC}"
  echo -e "${YELLOW}Continuando mesmo sem conexão ao banco. A aplicação pode funcionar em modo offline.${NC}"
fi

# Constrói a aplicação
echo -e "${YELLOW}Construindo a aplicação...${NC}"
npm run build

# Inicia os serviços com Docker se o docker-compose.yml existir
if [ -f "$DEPLOY_DIR/docker-compose.yml" ]; then
  echo -e "${YELLOW}Iniciando serviços com Docker...${NC}"
  cd "$DEPLOY_DIR" || exit 1
  docker-compose up -d
  
  # Verifica se os serviços estão rodando
  echo -e "${YELLOW}Verificando status dos serviços...${NC}"
  docker-compose ps
  
  echo -e "${GREEN}===============================================${NC}"
  echo -e "${GREEN}   Sistema implantado com sucesso via Docker!  ${NC}"
  echo -e "${GREEN}===============================================${NC}"
  echo -e "${GREEN}O sistema estará disponível em http://localhost:8080${NC}"
  echo -e "${YELLOW}Para verificar os logs, use: docker-compose logs -f${NC}"
  echo -e "${YELLOW}Para parar os serviços, use: docker-compose down${NC}"
else
  echo -e "${YELLOW}docker-compose.yml não encontrado.${NC}"
  echo -e "${YELLOW}Você pode iniciar a aplicação manualmente com: npm run preview${NC}"
  
  echo -e "${GREEN}===============================================${NC}"
  echo -e "${GREEN}   Build concluído com sucesso!               ${NC}"
  echo -e "${GREEN}===============================================${NC}"
  echo -e "${YELLOW}Para iniciar a aplicação manualmente:${NC}"
  echo -e "${YELLOW}cd $DEPLOY_DIR && npm run preview${NC}"
fi

echo -e "${GREEN}Backup dos arquivos anteriores disponível em: ${BACKUP_DIR}${NC}"
