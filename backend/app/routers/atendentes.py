from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from .auth import get_db_connection, oauth2_scheme, get_current_user

router = APIRouter()

# Modelo para atendente
class AtendenteBase(BaseModel):
    email: str  # Campo 'usuario' no frontend é email no banco
    nome: str   # Campo 'nome_completo' no frontend é nome no banco
    
class AtendenteCreate(AtendenteBase):
    senha: str
    ativo: bool = True

class AtendenteUpdate(BaseModel):
    nome: Optional[str] = None  # nome do atendente
    ativo: Optional[bool] = None

class Atendente(AtendenteBase):
    id: str
    ativo: bool
    url_imagem: Optional[str] = None

# Listar todos os atendentes
@router.get("/")
async def list_atendentes(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT id, nome, email, url_imagem, ativo
            FROM atendentes
            ORDER BY nome
        """)
        atendentes = cur.fetchall()
        
        # Mapper para compatibilidade com o frontend
        result = []
        for atendente in atendentes:
            result.append({
                "id": atendente["id"],
                "nome_completo": atendente["nome"],  # Mapeia nome para nome_completo
                "usuario": atendente["email"],       # Mapeia email para usuario
                "ativo": atendente["ativo"],
                "url_imagem": atendente["url_imagem"]
            })
            
        cur.close()
        conn.close()
        return result  # Retorna array diretamente
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
        # Verificar se já existe um atendente com este email
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id FROM atendentes WHERE email = %s", (atendente.email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Já existe um atendente com o email {atendente.email}"
            )
        
        # Primeiro criar uma entrada na tabela de login para autenticar
        cur.execute(
            """
            INSERT INTO login (usuario, senha, ativo, admin)
            VALUES (%s, %s, true, false)
            RETURNING id
            """,
            (atendente.email, hashed_password)
        )
        login_id = cur.fetchone()["id"]
        
        # Agora criar o atendente
        cur.execute(
            """
            INSERT INTO atendentes (id, nome, email, url_imagem, ativo)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, nome, email, url_imagem, ativo
            """,
            (login_id, atendente.nome, atendente.email, None, atendente.ativo)
        )
        new_atendente = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        # Mapear para formato esperado pelo frontend
        return {
            "id": new_atendente["id"],
            "nome_completo": new_atendente["nome"],
            "usuario": new_atendente["email"],
            "ativo": new_atendente["ativo"],
            "url_imagem": new_atendente["url_imagem"]
        }
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
        cur.execute("SELECT * FROM login WHERE id = %s", (atendente_id,))
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
            UPDATE login 
            SET senha = %s
            WHERE id = %s
            RETURNING id, usuario, admin, ativo
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
