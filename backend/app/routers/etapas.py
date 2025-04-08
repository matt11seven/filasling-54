from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from .auth import get_db_connection, oauth2_scheme, get_current_user

router = APIRouter()

# Modelo para etapa
class EtapaBase(BaseModel):
    nome: str
    numero: int
    numero_sistema: Optional[int] = None
    cor: str  # Cor é essencial para representação visual

class EtapaCreate(EtapaBase):
    pass

class EtapaUpdate(BaseModel):
    nome: Optional[str] = None
    numero: Optional[int] = None
    numero_sistema: Optional[int] = None
    cor: Optional[str] = None

class Etapa(EtapaBase):
    id: str
    data_criado: str
    data_atualizado: str

# Listar todas as etapas
@router.get("/")
async def list_etapas(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT id, nome, numero, numero_sistema, cor, data_criado, data_atualizado
            FROM etapas
            ORDER BY numero
        """)
        etapas = cur.fetchall()
        cur.close()
        conn.close()
        return etapas  # Retorna diretamente a lista, para compatibilidade com o frontend
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar etapas: {str(e)}"
        )

# Obter etapa por ID
@router.get("/{etapa_id}")
async def get_etapa(etapa_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT id, nome, numero, numero_sistema, cor, data_criado, data_atualizado
            FROM etapas
            WHERE id = %s
        """, (etapa_id,))
        etapa = cur.fetchone()
        cur.close()
        conn.close()
        
        if etapa is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Etapa não encontrada"
            )
            
        return etapa
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar etapa: {str(e)}"
        )

# Criar nova etapa
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_etapa(etapa: EtapaCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        # Verificar se já existe etapa com o mesmo número
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id FROM etapas WHERE numero = %s", (etapa.numero,))
        exists = cur.fetchone()
        if exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe uma etapa com este número"
            )
        
        # Inserir nova etapa
        cur.execute("""
            INSERT INTO etapas (nome, numero, numero_sistema, cor)
            VALUES (%s, %s, %s, %s)
            RETURNING *
        """, (etapa.nome, etapa.numero, etapa.numero_sistema, etapa.cor))
        
        new_etapa = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        # Retorna a etapa completa para o frontend
        return new_etapa
    except HTTPException:
        conn.close()
        raise
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar etapa: {str(e)}"
        )

# Atualizar etapa
@router.put("/{etapa_id}")
async def update_etapa(etapa_id: str, etapa: EtapaUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        # Verificar se a etapa existe
        cur = conn.cursor()
        cur.execute("SELECT id FROM etapas WHERE id = %s", (etapa_id,))
        exists = cur.fetchone()
        if not exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Etapa não encontrada"
            )
        
        # Construir query de atualização dinamicamente com base nos campos fornecidos
        update_fields = []
        values = []
        
        if etapa.nome is not None:
            update_fields.append("nome = %s")
            values.append(etapa.nome)
            
        if etapa.numero is not None:
            # Verificar se já existe etapa com o mesmo número
            cur.execute("SELECT id FROM etapas WHERE numero = %s AND id != %s", (etapa.numero, etapa_id))
            exists = cur.fetchone()
            if exists:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe outra etapa com este número"
                )
            update_fields.append("numero = %s")
            values.append(etapa.numero)
            
        if etapa.numero_sistema is not None:
            update_fields.append("numero_sistema = %s")
            values.append(etapa.numero_sistema)
            
        if etapa.cor is not None:
            update_fields.append("cor = %s")
            values.append(etapa.cor)
        
        # Adicionar atualização do timestamp
        update_fields.append("data_atualizado = CURRENT_TIMESTAMP")
        
        # Se não há campos para atualizar
        if not update_fields:
            return {"message": "Nenhum campo fornecido para atualização"}
        
        # Construir e executar a query
        query = f"UPDATE etapas SET {', '.join(update_fields)} WHERE id = %s"
        values.append(etapa_id)
        
        cur.execute(query, values)
        conn.commit()
        cur.close()
        conn.close()
        
        return {"message": "Etapa atualizada com sucesso"}
    except HTTPException:
        conn.close()
        raise
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar etapa: {str(e)}"
        )

# Excluir etapa
@router.delete("/{etapa_id}")
async def delete_etapa(etapa_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        # Verificar se a etapa existe
        cur = conn.cursor()
        cur.execute("SELECT id FROM etapas WHERE id = %s", (etapa_id,))
        exists = cur.fetchone()
        if not exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Etapa não encontrada"
            )
        
        # Verificar se a etapa está sendo usada em tickets
        cur.execute("SELECT id FROM tickets WHERE etapa_numero = (SELECT numero FROM etapas WHERE id = %s)", (etapa_id,))
        in_use = cur.fetchone()
        if in_use:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta etapa está sendo usada em tickets e não pode ser excluída"
            )
        
        # Excluir etapa
        cur.execute("DELETE FROM etapas WHERE id = %s", (etapa_id,))
        conn.commit()
        cur.close()
        conn.close()
        
        return {"message": "Etapa excluída com sucesso"}
    except HTTPException:
        conn.close()
        raise
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir etapa: {str(e)}"
        )
