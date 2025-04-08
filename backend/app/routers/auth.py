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
    return pwd_context.verify(plain_password, hashed_password)

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
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME,
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao conectar ao banco de dados"
        )

# Função para obter usuário do banco de dados
def get_user_by_username(username: str):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # Tratando usuário master como caso especial
        if username.lower() == 'matt@slingbr.com':
            return {
                "id": "1",
                "usuario": username,
                "senha": pwd_context.hash("senha_master"),
                "admin": True
            }
            
        cur.execute("SELECT id, usuario, senha, admin FROM usuarios WHERE usuario = %s", (username,))
        user = cur.fetchone()
        cur.close()
        conn.close()
        return user
    except Exception as e:
        print(f"Erro ao buscar usuário: {e}")
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar usuário no banco de dados"
        )

# Função para autenticar usuário
def authenticate_user(username: str, password: str):
    user = get_user_by_username(username)
    
    # Caso especial para usuário master
    if username.lower() == 'matt@slingbr.com':
        # Para o usuário master em ambiente de desenvolvimento, aceita qualquer senha
        return user
    
    if not user:
        return False
    
    # No caso de usuários normais, verifica a senha
    if not verify_password(password, user["senha"]):
        return False
        
    return user

# Endpoint para login
@router.post("/login")
async def login(user_data: UserLogin):
    user = authenticate_user(user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Gerar token JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["usuario"], "id": user["id"]},
        expires_delta=access_token_expires
    )
    
    # Retornar token e dados do usuário
    return {
        "id": user["id"],
        "usuario": user["usuario"],
        "isAdmin": user["admin"],
        "access_token": access_token,
        "token_type": "bearer"
    }
