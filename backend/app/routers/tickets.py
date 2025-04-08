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
    usuario: str
    descricao: str
    prioridade: int

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    status: str
    atendente_id: Optional[str] = None
    
class Ticket(TicketBase):
    id: str
    data_criacao: datetime
    status: str
    atendente_id: Optional[str] = None

# A função get_current_user foi movida para o módulo auth

# Listar todos os tickets
@router.get("/")
async def list_tickets(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT t.id, t.usuario, t.descricao, t.prioridade, t.data_criacao, 
                   t.status, t.atendente_id, a.nome as atendente_nome
            FROM tickets t
            LEFT JOIN atendentes a ON t.atendente_id = a.id
            ORDER BY 
                CASE 
                    WHEN t.status = 'pendente' THEN 1
                    WHEN t.status = 'em_atendimento' THEN 2
                    WHEN t.status = 'concluido' THEN 3
                    ELSE 4
                END,
                t.prioridade DESC,
                t.data_criacao
        """)
        tickets = cur.fetchall()
        cur.close()
        conn.close()
        return {"tickets": tickets}
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
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO tickets (usuario, descricao, prioridade, data_criacao, status)
            VALUES (%s, %s, %s, NOW(), 'pendente')
            RETURNING id, usuario, descricao, prioridade, data_criacao, status
            """,
            (ticket.usuario, ticket.descricao, ticket.prioridade)
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
            
        # Atualizar ticket
        cur.execute(
            """
            UPDATE tickets 
            SET status = %s, atendente_id = %s
            WHERE id = %s
            RETURNING id, usuario, descricao, prioridade, data_criacao, status, atendente_id
            """,
            (ticket_update.status, ticket_update.atendente_id, ticket_id)
        )
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
