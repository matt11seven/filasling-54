from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from typing import List, Optional
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Importar routers
from app.routers import auth, tickets, atendentes, etapas

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
app.include_router(etapas.router, prefix=f"{API_PREFIX}/etapas", tags=["etapas"])

# Rota de health check
@app.get(f"{API_PREFIX}/health", tags=["health"])
def health_check():
    return {"status": "ok", "message": "API is running"}

# Rota simples para testar diretamente a conexão com o banco
@app.get("/dbtest")
def db_test():
    import psycopg2
    from psycopg2.extras import RealDictCursor
    import traceback
    
    # Obter variáveis de ambiente
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "filasling")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "postgres")
    
    result = {
        "db_settings": {
            "host": db_host,
            "port": db_port,
            "database": db_name,
            "user": db_user,
            "password": "*****"  # Não mostrar a senha real
        },
        "connection_test": None,
        "login_table_test": None,
        "error": None
    }
    
    try:
        # Tentar conectar direto ao PostgreSQL
        print(f"Tentando conectar ao banco: {db_host}:{db_port}/{db_name}")
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password,
            dbname=db_name,
            connect_timeout=5
        )
        result["connection_test"] = "success"
        
        # Testar consulta simples
        cursor = conn.cursor()
        cursor.execute("SELECT version()")
        version = cursor.fetchone()
        result["db_version"] = version[0] if version else None
        
        # Verificar tabela login
        try:
            cursor.execute("SELECT COUNT(*) FROM login")
            count = cursor.fetchone()[0]
            result["login_table_test"] = {
                "exists": True,
                "count": count
            }
        except Exception as table_err:
            result["login_table_test"] = {
                "exists": False,
                "error": str(table_err)
            }
            
        # Verificar estrutura da tabela login
        try:
            cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='login'")
            columns = [row[0] for row in cursor.fetchall()]
            result["login_table_columns"] = columns
        except Exception as columns_err:
            result["login_table_columns_error"] = str(columns_err)
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        result["connection_test"] = "failed"
        result["error"] = str(e)
        result["traceback"] = traceback.format_exc()
    
    return result

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
