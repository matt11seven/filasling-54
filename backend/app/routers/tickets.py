from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import datetime
from pydantic import BaseModel
from .auth import get_db_connection, oauth2_scheme, get_current_user

router = APIRouter()

# Modelo para ticket
class TicketBase(BaseModel):
    nome: str  # nome do cliente/solicitante
    motivo: str  # descrição do problema/solicitação
    telefone: Optional[str] = None
    setor: Optional[str] = None
    user_ns: Optional[str] = None  # identificador do usuário no sistema

class TicketCreate(TicketBase):
    atendente_id: Optional[str] = None
    etapa_numero: int = 1  # Por padrão, começa na etapa 1 (Aguardando)

class TicketUpdate(BaseModel):
    nome: Optional[str] = None
    motivo: Optional[str] = None
    telefone: Optional[str] = None
    setor: Optional[str] = None
    etapa_numero: Optional[int] = None  # Número da etapa para atualização
    atendente_id: Optional[str] = None
    numero_sistema: Optional[int] = None  # Número de identificação no sistema externo
    
class Ticket(TicketBase):
    id: str
    etapa_numero: int
    atendente_id: Optional[str] = None
    nome_atendente: Optional[str] = None
    email_atendente: Optional[str] = None
    url_imagem_atendente: Optional[str] = None
    numero_sistema: Optional[int] = None
    data_criado: datetime
    data_atualizado: datetime
    data_saida_etapa1: Optional[datetime] = None

# A função get_current_user foi movida para o módulo auth

# Listar todos os tickets
@router.get("/")
async def list_tickets(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT t.*, e.nome as etapa_nome, e.cor as etapa_cor, 
                   a.nome as nome_atendente, a.email as email_atendente, a.url_imagem as url_imagem_atendente
            FROM tickets t
            LEFT JOIN etapas e ON t.etapa_numero = e.numero
            LEFT JOIN atendentes a ON t.atendente_id = a.id
            ORDER BY 
                CASE 
                    WHEN t.etapa_numero = 1 THEN 1
                    WHEN t.etapa_numero = 2 THEN 2
                    WHEN t.etapa_numero = 3 THEN 3
                    ELSE t.etapa_numero
                END,
                t.data_criado DESC
        """)
        tickets = cur.fetchall()
        cur.close()
        conn.close()
        return tickets
    except Exception as e:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar tickets: {str(e)}"
        )

# Criar novo ticket
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_ticket(ticket: TicketCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        # Se um atendente_id foi fornecido, buscar informações do atendente
        nome_atendente = None
        email_atendente = None
        url_imagem_atendente = None
        
        if ticket.atendente_id:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT nome, email, url_imagem FROM atendentes WHERE id = %s", (ticket.atendente_id,))
            atendente = cur.fetchone()
            if atendente:
                nome_atendente = atendente["nome"]
                email_atendente = atendente["email"]
                url_imagem_atendente = atendente["url_imagem"]
        
        # Inserir novo ticket
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            INSERT INTO tickets (nome, motivo, telefone, setor, user_ns, atendente_id, 
                              nome_atendente, email_atendente, url_imagem_atendente, 
                              etapa_numero, data_criado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            RETURNING *
            """,
            (ticket.nome, ticket.motivo, ticket.telefone, ticket.setor, ticket.user_ns,
             ticket.atendente_id, nome_atendente, email_atendente, url_imagem_atendente,
             ticket.etapa_numero)
        )
        new_ticket = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return new_ticket
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar ticket: {str(e)}"
        )

# Atualizar ticket
@router.put("/{ticket_id}")
async def update_ticket(
    ticket_id: str, 
    ticket_update: TicketUpdate, 
    current_user: dict = Depends(get_current_user)
):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # Verificar se o ticket existe
        cur.execute("SELECT * FROM tickets WHERE id = %s", (ticket_id,))
        existing_ticket = cur.fetchone()
        
        if not existing_ticket:
            cur.close()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ticket com ID {ticket_id} não encontrado"
            )

        # Prepara os valores para update
        update_fields = []
        values = []
        
        # Campos básicos
        if ticket_update.nome is not None:
            update_fields.append("nome = %s")
            values.append(ticket_update.nome)
            
        if ticket_update.motivo is not None:
            update_fields.append("motivo = %s")
            values.append(ticket_update.motivo)
            
        if ticket_update.telefone is not None:
            update_fields.append("telefone = %s")
            values.append(ticket_update.telefone)
            
        if ticket_update.setor is not None:
            update_fields.append("setor = %s")
            values.append(ticket_update.setor)

        # Atualização de atendente
        if ticket_update.atendente_id is not None:
            update_fields.append("atendente_id = %s")
            values.append(ticket_update.atendente_id)
            
            # Se tiver um atendente, busca os dados dele para atualizar
            if ticket_update.atendente_id:
                cur.execute("SELECT nome, email, url_imagem FROM atendentes WHERE id = %s", (ticket_update.atendente_id,))
                atendente = cur.fetchone()
                if atendente:
                    update_fields.append("nome_atendente = %s")
                    values.append(atendente["nome"])
                    update_fields.append("email_atendente = %s")
                    values.append(atendente["email"])
                    update_fields.append("url_imagem_atendente = %s")
                    values.append(atendente["url_imagem"])

        # Atualização de etapa
        if ticket_update.etapa_numero is not None:
            # Verificar se a etapa anterior era 1 e se está mudando de etapa
            if existing_ticket["etapa_numero"] == 1 and ticket_update.etapa_numero != 1:
                # Registrar data em que o ticket saiu da etapa 1
                update_fields.append("data_saida_etapa1 = CURRENT_TIMESTAMP")
                
            update_fields.append("etapa_numero = %s")
            values.append(ticket_update.etapa_numero)

        # Atualização de número de sistema
        if ticket_update.numero_sistema is not None:
            update_fields.append("numero_sistema = %s")
            values.append(ticket_update.numero_sistema)

        # Sempre atualiza a data de atualização
        update_fields.append("data_atualizado = CURRENT_TIMESTAMP")

        # Se não há nada para atualizar
        if not update_fields:
            return {"message": "Nenhum campo fornecido para atualização"}
            
        # Construir e executar query de update
        query = f"UPDATE tickets SET {', '.join(update_fields)} WHERE id = %s RETURNING *"
        values.append(ticket_id)
        
        cur.execute(query, values)
        updated_ticket = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return updated_ticket
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar ticket: {str(e)}"
        )

# Deletar ticket
@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # Verificar se o ticket existe
        cur.execute("SELECT * FROM tickets WHERE id = %s", (ticket_id,))
        existing_ticket = cur.fetchone()
        
        if not existing_ticket:
            cur.close()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ticket com ID {ticket_id} não encontrado"
            )
            
        # Deletar ticket
        cur.execute("DELETE FROM tickets WHERE id = %s", (ticket_id,))
        conn.commit()
        cur.close()
        conn.close()
        return None
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar ticket: {str(e)}"
        )
