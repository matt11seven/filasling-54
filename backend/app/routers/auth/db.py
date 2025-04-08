
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import HTTPException, status
import os
from dotenv import load_dotenv
import traceback

# Carregar variáveis de ambiente
load_dotenv()

# Conexão ao banco de dados
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_NAME = os.getenv("DB_NAME", "filasling")

def get_db_connection():
    """Obtém uma conexão com o banco de dados PostgreSQL."""
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

def get_user_by_username(username: str):
    """Busca um usuário pelo nome de usuário."""
    # Tratando usuário master como caso especial
    if username.lower() == 'matt@slingbr.com':
        print("Usando usuário master especial")
        from .security import pwd_context
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

def check_user_active(username: str):
    """Verifica se um usuário está ativo."""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute(
        "SELECT ativo FROM login WHERE usuario = %s",
        (username,)
    )
    
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return result
