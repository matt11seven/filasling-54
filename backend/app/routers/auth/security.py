
from fastapi import HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt, ExpiredSignatureError
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv
import traceback

# Carregar variáveis de ambiente
load_dotenv()

# Configuração de segurança
SECRET_KEY = os.getenv("SECRET_KEY", "chave_secreta_padrao_temporaria_nao_usar_em_producao")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 horas

# Contexto de criptografia para senhas
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # Usar 12 rounds para bcrypt
    bcrypt__ident="2a"  # Suportar formato antigo $2a$ para compatibilidade
)

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
        # Verificar se o hash está vazio ou é inválido
        if not hashed_password or not isinstance(hashed_password, str):
            print("Hash inválido ou vazio")
            return False
            
        # Verificar o formato do hash
        hash_format = hashed_password[:4] if len(hashed_password) > 4 else ''
        print(f"Formato do hash: {hash_format}")
        
        # Tentar verificar a senha
        result = pwd_context.verify(plain_password, hashed_password)
        print(f"Resultado da verificação de senha: {result}")
        return result
        
    except Exception as e:
        print(f"ERRO na verificação de senha: {str(e)}")
        # Em caso de erro na verificação, retornar False em vez de lançar exceção
        return False

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
    
    # Log para debug
    print(f"Criando token com payload: {to_encode}")
    print(f"Expiração: {expire.isoformat()} UTC")
    
    # Gerar o token JWT
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        print(f"Erro ao gerar token JWT: {e}")
        traceback.print_exc()
        raise

def decode_token(token: str) -> Dict[str, Any]:
    """Decodifica e verifica um token JWT."""
    try:
        # Imprimir parte do token para debug (sem revelar todo o token)
        token_part = token[:20] + "..." if len(token) > 20 else token
        print(f"Decodificando token: {token_part}")
        
        # Verificar se o token está vazio ou é inválido
        if not token or not isinstance(token, str):
            print("Token inválido: vazio ou tipo incorreto")
            raise credentials_exception
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario: str = payload.get("sub")
        user_id: str = payload.get("id")
        
        if usuario is None or user_id is None:
            print("Token inválido: 'sub' ou 'id' ausente no payload")
            raise credentials_exception
        
        # Verificar expiração explicitamente
        exp = payload.get("exp")
        if exp is None:
            print("Token inválido: sem data de expiração")
            raise credentials_exception
            
        if datetime.fromtimestamp(exp) < datetime.utcnow():
            print(f"Token expirado. Expiração: {datetime.fromtimestamp(exp).isoformat()}, Agora: {datetime.utcnow().isoformat()}")
            raise ExpiredSignatureError("Token expirado")
            
        print(f"Token válido para usuário: {usuario}, id: {user_id}")
        return payload
        
    except ExpiredSignatureError:
        print("Erro de token: Assinatura expirada")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as e:
        print(f"Erro de JWT ao decodificar token: {e}")
        raise credentials_exception
    except Exception as e:
        print(f"Erro inesperado ao decodificar token: {e}")
        traceback.print_exc()
        raise credentials_exception
