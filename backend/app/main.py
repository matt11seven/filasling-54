from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from typing import List, Optional
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Importar routers
from app.routers import auth, tickets, atendentes

# Criar aplicação FastAPI
app = FastAPI(
    title="FilaSling API",
    description="API para o sistema FilaSling de gerenciamento de filas e tickets",
    version="1.0.0"
)

# Configurações de CORS
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prefixo global para todos os endpoints
API_PREFIX = "/api"

# Incluir routers com prefixo /api
app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["auth"])
app.include_router(tickets.router, prefix=f"{API_PREFIX}/tickets", tags=["tickets"])
app.include_router(atendentes.router, prefix=f"{API_PREFIX}/atendentes", tags=["atendentes"])

# Rota de health check
@app.get(f"{API_PREFIX}/health", tags=["health"])
def health_check():
    return {"status": "ok", "message": "API is running"}

# Rota raiz para o prefixo /api
@app.get(f"{API_PREFIX}", tags=["root"])
def read_api_root():
    return {"message": "Bem-vindo à API FilaSling. Acesse /docs para a documentação."}

# Rota raiz principal
@app.get("/", tags=["root"])
def read_root():
    return {"message": "Bem-vindo à API FilaSling. Acesse /api para endpoints da API ou /docs para documentação."}

if __name__ == "__main__":
    import uvicorn
    # Usar valores padrão ou do ambiente para a configuração do servidor
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
