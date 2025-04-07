
# Sistema de Fila by Sling

## Sobre o Projeto

Sistema de gerenciamento de filas para controle de atendimento desenvolvido pela Sling Soluções de Mercado.

## Tecnologias utilizadas

Este projeto é construído com:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- PostgreSQL
- Docker

## Configuração para Desenvolvimento

### Pré-requisitos
- Docker e Docker Compose
- Node.js v18 ou superior

### Instalação
1. Clone o repositório
2. Copie o arquivo `.env.example` para `.env` e configure as variáveis
   ```
   cp .env.example .env
   ```
3. Inicie o ambiente de desenvolvimento com Docker
   ```
   docker-compose up -d
   ```

## Deploy em Produção

### Usando Docker Compose
1. Configure suas variáveis de ambiente:
   ```
   cp .env.example .env
   ```
   Edite o arquivo `.env` com os valores adequados para produção.

2. Inicie os serviços:
   ```
   docker-compose up -d
   ```

### Variáveis de Ambiente Obrigatórias
- `SUPABASE_URL`: URL do seu projeto Supabase
- `SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `DB_USER`: Usuário do PostgreSQL
- `DB_PASSWORD`: Senha do PostgreSQL
- `DB_NAME`: Nome do banco de dados
- `DB_HOST`: Host do banco de dados
- `DB_PORT`: Porta do PostgreSQL (padrão: 5432)

## Contato

Para mais informações, entre em contato:

- Site: [www.slingbr.com](https://www.slingbr.com)
- Instagram: [@slingbr_](https://www.instagram.com/slingbr_)
