
#!/bin/bash

# Script para facilitar o deploy do sistema

# Verificar se .env existe, caso contrário, criar a partir do exemplo
if [ ! -f .env ]; then
    echo "Arquivo .env não encontrado. Criando a partir do .env.example..."
    cp .env.example .env
    echo "Por favor, edite o arquivo .env com suas configurações antes de continuar."
    exit 1
fi

# Iniciar os serviços Docker
echo "Iniciando serviços..."
docker-compose up -d

# Verificar se os serviços estão rodando
echo "Verificando status dos serviços..."
docker-compose ps

echo ""
echo "Sistema implantado com sucesso!"
echo "O sistema estará disponível em http://localhost:8080"
echo ""
echo "Para verificar os logs, use: docker-compose logs -f"
echo "Para parar os serviços, use: docker-compose down"
