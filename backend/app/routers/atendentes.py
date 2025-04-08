from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from .auth import get_db_connection, oauth2_scheme, get_current_user

router = APIRouter()

# Modelo para atendente
class AtendenteBase(BaseModel):
    usuario: str
    nome_completo: str
    
class AtendenteCreate(AtendenteBase):
    senha: str
    admin: bool = False

class AtendenteUpdate(BaseModel):
    nome_completo: Optional[str] = None
    ativo: Optional[bool] = None
    admin: Optional[bool] = None

class Atendente(AtendenteBase):
    id: str
    ativo: bool
    admin: bool

# Listar todos os atendentes
@router.get("/")
async def list_atendentes(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, nome as nome_completo, email as usuario, ativo, false as admin
            FROM atendentes
            ORDER BY nome
        """)
        atendentes = cur.fetchall()
        cur.close()
        conn.close()
        return {"atendentes": atendentes}
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar atendentes: {str(e)}"
        )

# Obter atendente por ID
@router.get("/{atendente_id}")
async def get_atendente(atendente_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, usuario, nome_completo, ativo, admin
            FROM usuarios
            WHERE id = %s
        """, (atendente_id,))
        atendente = cur.fetchone()
        cur.close()
        conn.close()
        
        if not atendente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Atendente com ID {atendente_id} não encontrado"
            )
            
        return atendente
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar atendente: {str(e)}"
        )

# Criar novo atendente
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_atendente(
    atendente: AtendenteCreate, 
    current_user: dict = Depends(get_current_user)
):
    from .auth import pwd_context
    
    # Hash da senha
    hashed_password = pwd_context.hash(atendente.senha)
    
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # Verificar se já existe um usuário com este email
        cur.execute("SELECT id FROM usuarios WHERE usuario = %s", (atendente.usuario,))
        if cur.fetchone():
            cur.close()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Já existe um atendente com o email {atendente.usuario}"
            )
            
        # Inserir novo atendente
        cur.execute(
            """
            INSERT INTO usuarios (usuario, nome_completo, senha, ativo, admin)
            VALUES (%s, %s, %s, true, %s)
            RETURNING id, usuario, nome_completo, ativo, admin
            """,
            (atendente.usuario, atendente.nome_completo, hashed_password, atendente.admin)
        )
        new_atendente = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return new_atendente
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar atendente: {str(e)}"
        )

# Atualizar atendente
@router.put("/{atendente_id}")
async def update_atendente(
    atendente_id: str, 
    atendente_update: AtendenteUpdate, 
    current_user: dict = Depends(get_current_user)
):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # Verificar se o atendente existe
        cur.execute("SELECT * FROM usuarios WHERE id = %s", (atendente_id,))
        existing_atendente = cur.fetchone()
        
        if not existing_atendente:
            cur.close()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Atendente com ID {atendente_id} não encontrado"
            )
            
        # Construir a consulta de atualização
        update_fields = []
        params = []
        
        if atendente_update.nome_completo is not None:
            update_fields.append("nome_completo = %s")
            params.append(atendente_update.nome_completo)
            
        if atendente_update.ativo is not None:
            update_fields.append("ativo = %s")
            params.append(atendente_update.ativo)
            
        if atendente_update.admin is not None:
            update_fields.append("admin = %s")
            params.append(atendente_update.admin)
            
        if not update_fields:
            cur.close()
            conn.close()
            return existing_atendente
            
        # Montar a consulta SQL
        query = f"""
            UPDATE usuarios 
            SET {", ".join(update_fields)}
            WHERE id = %s
            RETURNING id, usuario, nome_completo, ativo, admin
        """
        params.append(atendente_id)
        
        # Executar a atualização
        cur.execute(query, params)
        updated_atendente = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return updated_atendente
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar atendente: {str(e)}"
        )

# Atualizar senha do atendente
@router.put("/{atendente_id}/senha")
async def update_password(
    atendente_id: str, 
    senha: str, 
    current_user: dict = Depends(get_current_user)
):
    from .auth import pwd_context
    
    # Hash da nova senha
    hashed_password = pwd_context.hash(senha)
    
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # Verificar se o atendente existe
        cur.execute("SELECT * FROM usuarios WHERE id = %s", (atendente_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Atendente com ID {atendente_id} não encontrado"
            )
            
        # Atualizar senha
        cur.execute(
            """
            UPDATE usuarios 
            SET senha = %s
            WHERE id = %s
            RETURNING id, usuario, nome_completo, ativo, admin
            """,
            (hashed_password, atendente_id)
        )
        updated_atendente = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return {"message": "Senha atualizada com sucesso"}
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar senha: {str(e)}"
        )
