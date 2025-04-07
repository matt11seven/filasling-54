
// Create a mock implementation for browser environments
// This file provides a safe implementation for both Node.js and browser environments

// Type definition for our minimal PostgreSQL interface
interface PgQueryResult {
  rows: any[];
  rowCount: number;
}

// Mock Pool for browser environments
class MockPool {
  async connect() {
    console.warn("PostgreSQL direct connection is not supported in browser environments");
    throw new Error("PostgreSQL connection not available in browser");
  }
  
  async query(text: string, params: any[] = []): Promise<PgQueryResult> {
    console.warn("PostgreSQL query not supported in browser:", { text, params });
    return { rows: [], rowCount: 0 };
  }
  
  async end() {
    return;
  }
  
  on(event: string, callback: (err: Error) => void) {
    // Do nothing in browser
    return this;
  }
}

// Safely try to import pg only in environments that support it
let Pool: any;
let isNodeEnvironment = false;

// Check if we're in a Node-like environment
try {
  // This check helps determine if we're in a Node-like environment
  isNodeEnvironment = typeof process !== 'undefined' && 
                     Boolean(process.versions) && 
                     Boolean(process.versions.node);
  
  if (isNodeEnvironment) {
    // Only try to require pg in Node environment
    const pg = require('pg');
    Pool = pg.Pool;
  } else {
    console.log('Running in browser environment, PostgreSQL client will be mocked');
    Pool = MockPool;
  }
} catch (error) {
  console.warn('Error importing PostgreSQL module, using mock implementation:', error);
  Pool = MockPool;
}

import { isUsingPostgresDirect, postgresConfig } from '../supabase/client';

// Configurar o pool de conexões PostgreSQL
let pool: any = null;

// Inicializar o pool apenas quando for necessário
function getPool(): any | null {
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
      
      // Check if we're running in an environment that supports PostgreSQL direct connections
      if (!isNodeEnvironment) {
        console.warn("⚠️ Tentativa de usar PostgreSQL direto em ambiente de navegador. Usando implementação simulada.");
        pool = new MockPool();
        return pool;
      }
      
      pool = new Pool({
        host: postgresConfig.host,
        user: postgresConfig.user,
        password: postgresConfig.password,
        database: postgresConfig.database,
        port: parseInt(postgresConfig.port, 10),
        // Adicionar timeout para não bloquear a renderização por muito tempo
        connectionTimeoutMillis: 5000
      });
      
      // Adicionar listener para erros de conexão
      pool.on('error', (err: Error) => {
        console.error('Erro inesperado no pool do PostgreSQL:', err);
      });
    } catch (error) {
      console.error('Falha ao criar pool de conexões PostgreSQL:', error);
      // Use mock pool as fallback in case of error
      pool = new MockPool();
    }
  }
  
  return pool;
}

// Função para executar consultas no PostgreSQL
export async function query(text: string, params: any[] = []): Promise<PgQueryResult> {
  const currentPool = getPool();
  if (!currentPool) {
    console.warn('PostgreSQL direto não está disponível, operação não executada:', { text });
    // Retornar um resultado vazio em vez de lançar erro
    return { rows: [], rowCount: 0 };
  }
  
  try {
    const start = Date.now();
    const res = await currentPool.query(text, params);
    const duration = Date.now() - start;
    console.log('Consulta executada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erro ao executar consulta:', error);
    // Retornar um resultado vazio em vez de lançar erro
    return { rows: [], rowCount: 0 };
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
  
  // In browser environment, return false immediately
  if (!isNodeEnvironment) {
    console.warn("PostgreSQL connection check not supported in browser environment");
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
