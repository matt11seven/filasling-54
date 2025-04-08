
from pydantic import BaseModel

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
