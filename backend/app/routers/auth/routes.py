from fastapi import APIRouter, Depends, HTTPException, status
from datetime import timedelta
import traceback
import psycopg2
from psycopg2.extras import RealDictCursor

from .models import UserLogin, User
from .security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from .authentication import authenticate_user, get_current_user
from .db import get_db_connection, check_user_active

router = APIRouter()

# Endpoint para verificar a conexão com o banco de dados
@router.get("/db-test")
async def test_database_connection():
    try:
        # Tentar conectar ao banco de dados
        conn = get_db_connection()
        
        # Testar consulta simples
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 as test")
            result = cursor.fetchone()
        
        # Testar uma consulta na tabela login
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
            cursor.execute("SELECT COUNT(*) as total_users FROM login")
            users_count = cursor.fetchone()
        
        # Fechar conexão
        conn.close()
        
        # Retornar sucesso
        from .db import DB_HOST, DB_NAME
        return {
            "status": "ok", 
            "message": "Conexão com o banco de dados bem-sucedida",
            "db_host": DB_HOST,
            "db_name": DB_NAME,
            "test_result": result,
            "users_count": users_count
        }
    except Exception as e:
        # Retornar detalhes do erro
        import traceback
        from .db import DB_HOST, DB_NAME, DB_USER
        return {
            "status": "error",
            "message": f"Erro ao conectar ao banco de dados: {str(e)}",
            "traceback": traceback.format_exc(),
            "db_host": DB_HOST,
            "db_name": DB_NAME,
            "db_user": DB_USER
        }

# Endpoint para verificação de sessão/usuário atual
@router.get("/login")
async def verify_session(current_user: dict = Depends(get_current_user)):
    try:
        print(f"== VERIFICAÇÃO DE SESSÃO ==")
        print(f"Usuário atual: {current_user['usuario']}")
        
        # Consulta adicional para verificar se o usuário está ativo
        result = check_user_active(current_user['usuario'])
        
        if result and result.get('ativo') is True:
            # Usuário ativo, retornar informações
            response = {
                "id": current_user["id"],
                "usuario": current_user["usuario"],
                "isAdmin": current_user.get("admin", False),
                "ativo": True
            }
            print(f"Sessão válida para: {current_user['usuario']}")
            return response
        else:
            # Usuário inativo ou não encontrado
            print(f"Sessão inválida: Usuário {current_user['usuario']} não está ativo")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário não está ativo",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"======= ERRO NA VERIFICAÇÃO DE SESSÃO =======")
        print(f"Erro: {e}")
        print(f"Stack trace:\n{error_trace}")
        print(f"==========================")
        # Para erros de sessão, retornar 401 para forçar novo login
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Erro na verificação de sessão: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Endpoint para login
@router.post("/login")
async def login(user_data: UserLogin):
    try:
        print(f"== NOVA TENTATIVA DE LOGIN ==")
        print(f"Tentativa de login para usuário: {user_data.username}")
        print(f"Informações do request recebido: username={user_data.username}, password_length={len(user_data.password)}")
        
        # Verificar usuário e senha
        user = authenticate_user(user_data.username, user_data.password)
        if not user:
            print(f"Login falhou: credenciais inválidas para {user_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais inválidas",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"Usuário autenticado: {user_data.username}, gerando token")
        
        # Gerar token JWT
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["usuario"], "id": user["id"]},
            expires_delta=access_token_expires
        )
        
        # Preparar resposta
        response = {
            "id": user["id"],
            "usuario": user["usuario"],
            "isAdmin": user.get("admin", False),  # Usar get para evitar erro se admin não existir
            "access_token": access_token,
            "token_type": "bearer"
        }
        
        print(f"Login bem-sucedido para: {user_data.username}")
        return response
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"======= ERRO NO LOGIN =======")
        print(f"Erro no login: {e}")
        print(f"Stack trace:\n{error_trace}")
        print(f"Usuario: {user_data.username}")
        print(f"=========================")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro no processo de login: {str(e)}"
        )
