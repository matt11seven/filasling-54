
import { Pool } from 'pg';
import { isUsingPostgresDirect, postgresConfig } from '../supabase/client';

// Configurar o pool de conexões PostgreSQL
let pool: Pool | null = null;

// Inicializar o pool apenas quando for necessário
function getPool(): Pool | null {
  if (!isUsingPostgresDirect) {
    console.log('PostgreSQL direto não está configurado, usando Supabase');
    return null;
  }
  
  if (!pool) {
    try {
      console.log('Inicializando pool de conexões PostgreSQL com:', {
        host: postgresConfig.host,
        user: postgresConfig.user,
        database: postgresConfig.database,
        port: parseInt(postgresConfig.port, 10)
      });
      
      pool = new Pool({
        host: postgresConfig.host,
        user: postgresConfig.user,
        password: postgresConfig.password,
        database: postgresConfig.database,
        port: parseInt(postgresConfig.port, 10)
      });
      
      // Adicionar listener para erros de conexão
      pool.on('error', (err) => {
        console.error('Erro inesperado no pool do PostgreSQL:', err);
      });
    } catch (error) {
      console.error('Falha ao criar pool de conexões PostgreSQL:', error);
      return null;
    }
  }
  
  return pool;
}

// Função para executar consultas no PostgreSQL
export async function query(text: string, params: any[] = []) {
  const currentPool = getPool();
  if (!currentPool) {
    throw new Error('PostgreSQL direto não está configurado');
  }
  
  try {
    const start = Date.now();
    const res = await currentPool.query(text, params);
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
    console.log('Fechando pool de conexões PostgreSQL');
    return pool.end();
  }
  return Promise.resolve();
}

// Verificar a conexão com o banco de dados
export async function checkConnection() {
  const currentPool = getPool();
  if (!currentPool) {
    console.log('Pool de conexões não está disponível');
    return false;
  }
  
  try {
    const client = await currentPool.connect();
    client.release();
    console.log('Conexão com PostgreSQL estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('Falha ao conectar ao PostgreSQL:', error);
    return false;
  }
}
