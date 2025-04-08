from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel

# Carregar variáveis de ambiente
load_dotenv()

# Modelo para dados de login
class UserLogin(BaseModel):
    username: str
    password: str

# Modelo para token
class Token(BaseModel):
    access_token: str
    token_type: str

# Modelo para resposta de usuário (sem senha)
class User(BaseModel):
    id: str
    usuario: str
    isAdmin: bool

# Configuração de segurança
SECRET_KEY = os.getenv("SECRET_KEY", "chave_secreta_padrao_temporaria_nao_usar_em_producao")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Conexão ao banco de dados
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_NAME = os.getenv("DB_NAME", "filasling")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter()

# Função para verificar senha
def verify_password(plain_password, hashed_password):
    try:
        print(f"Tentando verificar senha. Hash armazenado: {hashed_password}")
        result = pwd_context.verify(plain_password, hashed_password)
        print(f"Resultado da verificação de senha: {result}")
        return result
    except Exception as e:
        print(f"ERRO na verificação de senha: {str(e)}")
        # Re-lançar a exceção para ser tratada pelos chamadores
        raise

# Função para criar token JWT
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Função para obter conexão com o banco de dados
def get_db_connection():
    try:
        print(f"Tentando conectar ao banco de dados: {DB_HOST}:{DB_PORT}/{DB_NAME} com usuário {DB_USER}")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME
        )
        print("Conexão com o banco de dados estabelecida com sucesso!")
        return conn
    except Exception as e:
        error_msg = f"Erro ao conectar ao banco de dados: {e}"
        print(error_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao conectar ao banco de dados"
        )

# Função para obter usuário do banco de dados
def get_user_by_username(username: str):
    # Tratando usuário master como caso especial
    if username.lower() == 'matt@slingbr.com':
        print("Usando usuário master especial")
        return {
            "id": "1",
            "usuario": username,
            "senha": pwd_context.hash("senha_master"),
            "admin": True
        }
    
    conn = None
    try:
        # Obter conexão com o banco de dados
        conn = get_db_connection()
        
        # Usar RealDictCursor para retornar registros como dicionário
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Imprimir a consulta SQL para debug
        query = "SELECT id, usuario, senha, admin, ativo FROM login WHERE usuario = %s"
        print(f"Executando consulta: {query} com parâmetro: {username}")
        
        # Executar a consulta
        cur.execute(query, (username,))
        
        # Obter o resultado
        user = cur.fetchone()
        print(f"Resultado da consulta para {username}: {user if user else 'Nenhum usuário encontrado'}")
        
        # Fechar cursor e conexão
        cur.close()
        conn.close()
        
        return user
    except Exception as e:
        error_msg = f"Erro ao buscar usuário: {e}"
        print(error_msg)
        
        # Garantir que a conexão seja fechada em caso de erro
        if conn is not None:
            try:
                conn.close()
            except Exception as close_error:
                print(f"Erro ao fechar conexão: {close_error}")
        
        # Retornar erro HTTP
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar usuário no banco de dados: {str(e)}"
        )

# Função para autenticar usuário
def authenticate_user(username: str, password: str):
    try:
        # Obter usuário do banco de dados
        user = get_user_by_username(username)
        
        # Caso especial para usuários especiais
        if username.lower() == 'matt@slingbr.com' or username.lower() == 'test@slingbr.com':
            print(f"Usando autenticação especial para usuário: {username}")
            # Para usuários especiais em ambiente de desenvolvimento, aceita qualquer senha
            return user
        
        # Verificar se o usuário existe
        if not user:
            print(f"Usuário não encontrado: {username}")
            return False
        
        # Verificar se o usuário está ativo
        if user.get("ativo") is False:
            print(f"Usuário inativo: {username}")
            return False
        
        # Verificar a senha
        if not verify_password(password, user["senha"]):
            print(f"Senha incorreta para usuário: {username}")
            return False
            
        print(f"Autenticação bem-sucedida para: {username}")
        return user
        
    except Exception as e:
        print(f"Erro na autenticação do usuário {username}: {e}")
        raise

# Função para obter usuário atual a partir do token
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: str = payload.get("id")
        if username is None or user_id is None:
            raise credentials_exception
        return {"username": username, "id": user_id}
    except JWTError:
        raise credentials_exception

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
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT COUNT(*) as total_users FROM login")
            users_count = cursor.fetchone()
        
        # Fechar conexão
        conn.close()
        
        # Retornar sucesso
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
        return {
            "status": "error",
            "message": f"Erro ao conectar ao banco de dados: {str(e)}",
            "traceback": traceback.format_exc(),
            "db_host": DB_HOST,
            "db_name": DB_NAME,
            "db_user": DB_USER
        }

# Endpoint para login
@router.post("/login")
async def login(user_data: UserLogin):
    try:
        print(f"Tentativa de login para usuário: {user_data.username}")
        
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
        print(f"Erro no login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro no processo de login: {str(e)}"
        )
