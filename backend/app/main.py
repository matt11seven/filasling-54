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

# Incluir routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
app.include_router(atendentes.router, prefix="/atendentes", tags=["atendentes"])

# Rota de health check
@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "message": "API is running"}

# Rota raiz
@app.get("/", tags=["root"])
def read_root():
    return {"message": "Bem-vindo à API FilaSling. Acesse /docs para a documentação."}

if __name__ == "__main__":
    import uvicorn
    # Usar valores padrão ou do ambiente para a configuração do servidor
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
