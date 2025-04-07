
import { Pool } from 'pg';
import { isUsingPostgresDirect, postgresConfig } from '../supabase/client';

// Configurar o pool de conexões PostgreSQL
const pool = isUsingPostgresDirect ? new Pool({
  host: postgresConfig.host,
  user: postgresConfig.user,
  password: postgresConfig.password,
  database: postgresConfig.database,
  port: parseInt(postgresConfig.port, 10)
}) : null;

// Função para executar consultas no PostgreSQL
export async function query(text: string, params: any[] = []) {
  if (!isUsingPostgresDirect || !pool) {
    throw new Error('PostgreSQL direto não está configurado');
  }
  
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Consulta executada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erro ao executar consulta:', error);
    throw error;
  }
}

// Gerenciamento do ciclo de vida do pool
export function closePool() {
  if (pool) {
    return pool.end();
  }
  return Promise.resolve();
}

// Verificar a conexão com o banco de dados
export async function checkConnection() {
  if (!isUsingPostgresDirect || !pool) {
    return false;
  }
  
  try {
    const client = await pool.connect();
    client.release();
    console.log('Conexão com PostgreSQL estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('Falha ao conectar ao PostgreSQL:', error);
    return false;
  }
}
