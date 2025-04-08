
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configuração de segurança
SECRET_KEY = os.getenv("SECRET_KEY", "chave_secreta_padrao_temporaria_nao_usar_em_producao")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 horas

# Contexto de criptografia para senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer token para autenticação OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Exceção para credenciais inválidas
credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Credenciais inválidas",
    headers={"WWW-Authenticate": "Bearer"},
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha fornecida corresponde ao hash armazenado."""
    try:
        print(f"Tentando verificar senha. Hash armazenado: {hashed_password}")
        result = pwd_context.verify(plain_password, hashed_password)
        print(f"Resultado da verificação de senha: {result}")
        return result
    except Exception as e:
        print(f"ERRO na verificação de senha: {str(e)}")
        # Re-lançar a exceção para ser tratada pelos chamadores
        raise

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Cria um novo token JWT com os dados fornecidos e tempo de expiração."""
    to_encode = data.copy()
    
    # Define o tempo de expiração
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    
    # Só definir o campo "sub" se ele ainda não existir
    if "sub" not in to_encode:
        usuario = to_encode.get("usuario")
        if usuario:
            to_encode["sub"] = usuario
        else:
            # Se não houver nem "sub" nem "usuario", lançar erro
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Campo 'sub' ou 'usuario' é necessário para gerar o token"
            )
    
    # Gerar o token JWT
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Dict[str, Any]:
    """Decodifica e verifica um token JWT."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario: str = payload.get("sub")
        user_id: str = payload.get("id")
        if usuario is None or user_id is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception
