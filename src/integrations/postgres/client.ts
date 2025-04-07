
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
    console.warn("A API do servidor fará a conexão em seu nome");
    throw new Error("PostgreSQL connection not available in browser");
  }
  
  async query(text: string, params: any[] = []): Promise<PgQueryResult> {
    console.warn("PostgreSQL query not supported in browser:", { text, params });
    console.warn("Esta operação deve ser feita via API do servidor");
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

import { isUsingPostgresDirect, postgresConfig, analyzeConnectionError } from '../supabase/client';

// Configurar o pool de conexões PostgreSQL
let pool: any = null;

// Função para resetar o pool de conexões
export function resetPool() {
  if (pool) {
    console.log('Fechando pool de conexões PostgreSQL para reinicialização');
    try {
      pool.end();
    } catch (error) {
      console.error('Erro ao fechar pool:', error);
    }
    pool = null;
  }
}

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
        port: parseInt(postgresConfig.port, 10),
        isDockerEnv: postgresConfig.isDockerEnvironment,
        timestamp: new Date().toISOString()
      });
      
      // Check if we're running in an environment that supports PostgreSQL direct connections
      if (!isNodeEnvironment) {
        console.warn("⚠️ Tentativa de usar PostgreSQL direto em ambiente de navegador.");
        console.warn("⚠️ No navegador, conexões diretas com PostgreSQL não são possíveis por questões de segurança!");
        console.warn("⚠️ Em vez disso, use uma API proxy no servidor para se comunicar com o banco de dados.");
        console.warn("⚠️ Valores de conexão que estão sendo usados:", {
          host: postgresConfig.host || "não definido",
          port: postgresConfig.port || "não definido",
          database: postgresConfig.database || "não definido",
          user: postgresConfig.user || "não definido"
        });
        pool = new MockPool();
        return pool;
      }
      
      // Verificar se as configurações são válidas antes de tentar conectar
      if (!postgresConfig.host || postgresConfig.host === "DB_POSTGRESDB_HOST_PLACEHOLDER") {
        console.error("❌ Host do PostgreSQL não está definido corretamente!");
        console.error("Valores de conexão recebidos:", postgresConfig);
        pool = new MockPool();
        return pool;
      }
      
      // Verificar se o hostname está em um formato válido
      if (postgresConfig.host.length === 0) {
        console.error("❌ ERRO CRÍTICO: Host do PostgreSQL está vazio!");
        pool = new MockPool();
        return pool;
      }
      
      // Verificar se o hostname contém underscores e alertar
      if (postgresConfig.host.includes('_')) {
        if (postgresConfig.isDockerEnvironment) {
          console.log("✅ Ambiente Docker/EasyPanel detectado com hostname: " + postgresConfig.host);
          console.log("✅ Underscores em hostnames geralmente são válidos em ambientes Docker");
        } else {
          console.warn("⚠️ ATENÇÃO: O hostname do PostgreSQL contém underscores: " + postgresConfig.host);
          console.warn("⚠️ Em alguns ambientes, isso pode causar problemas de resolução DNS.");
        }
      }
      
      // Opções de conexão específicas para ambiente Docker
      const connectionOptions: any = {
        host: postgresConfig.host,
        user: postgresConfig.user,
        password: postgresConfig.password,
        database: postgresConfig.database,
        port: parseInt(postgresConfig.port, 10),
        // Adicionar timeout para não bloquear a renderização por muito tempo
        connectionTimeoutMillis: 10000, // Aumentado para 10 segundos
      };
      
      // Em ambiente Docker, podemos precisar de configurações específicas
      if (postgresConfig.isDockerEnvironment) {
        console.log("Aplicando configurações específicas para ambiente Docker");
      }
      
      pool = new Pool(connectionOptions);
      
      // Adicionar listener para erros de conexão
      pool.on('error', (err: Error) => {
        console.error('Erro inesperado no pool do PostgreSQL:', err);
        console.error('Análise detalhada do erro:', analyzeConnectionError(err));
      });
      
      // Log informativo sobre tentativa de conexão
      console.log(`Tentando conectar ao PostgreSQL em ${postgresConfig.host}:${postgresConfig.port}/${postgresConfig.database} como ${postgresConfig.user}`);
    } catch (error) {
      console.error('Falha ao criar pool de conexões PostgreSQL:', error);
      console.error('Análise detalhada do erro:', analyzeConnectionError(error));
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
    console.error('Análise detalhada do erro de consulta:', analyzeConnectionError(error));
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
    console.log("Tentando estabelecer conexão com o PostgreSQL...");
    const client = await currentPool.connect();
    console.log("Conexão estabelecida com sucesso, executando teste simples...");
    
    // Executar uma consulta simples para verificar se a conexão está realmente funcionando
    const result = await client.query('SELECT current_database() as db_name');
    const dbName = result.rows[0]?.db_name || 'desconhecido';
    
    console.log(`Teste de conexão concluído com sucesso. Banco: ${dbName}`);
    client.release();
    
    console.log('Conexão com PostgreSQL estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('Falha ao conectar ao PostgreSQL:', error);
    console.error('Análise detalhada do erro de conexão:', analyzeConnectionError(error));
    console.error('Detalhes de configuração:', {
      host: postgresConfig.host,
      port: postgresConfig.port,
      database: postgresConfig.database,
      user: postgresConfig.user,
      isDockerEnv: postgresConfig.isDockerEnvironment
    });
    return false;
  }
}

// Tentar conexão alternativa (apenas para diagnóstico)
export async function tryAlternativeConnection() {
  if (!isNodeEnvironment) {
    console.warn("Tentativas alternativas não são suportadas no navegador");
    return false;
  }
  
  if (postgresConfig.isDockerEnvironment) {
    try {
      console.log("Tentando abordagem alternativa para ambiente Docker...");
      
      // Em Docker, às vezes o serviço é acessível pelo nome do serviço sem domínio
      const serviceName = postgresConfig.host.split('.')[0];
      
      // Criar um pool temporário para teste
      const pg = require('pg');
      const tempPool = new pg.Pool({
        host: serviceName,
        user: postgresConfig.user,
        password: postgresConfig.password,
        database: postgresConfig.database,
        port: parseInt(postgresConfig.port, 10),
        connectionTimeoutMillis: 5000
      });
      
      const client = await tempPool.connect();
      client.release();
      await tempPool.end();
      
      console.log(`✅ Conexão alternativa bem-sucedida usando nome do serviço: ${serviceName}`);
      return true;
    } catch (error) {
      console.error("❌ Tentativa alternativa falhou:", error);
      return false;
    }
  }
  
  return false;
}

// Fornecer informações detalhadas sobre o estado da conexão
export function getConnectionDiagnostics() {
  return {
    isNode: isNodeEnvironment,
    hasPool: Boolean(pool),
    config: {
      host: postgresConfig.host,
      port: postgresConfig.port,
      database: postgresConfig.database,
      user: postgresConfig.user,
      isDockerEnv: postgresConfig.isDockerEnvironment,
      originalHost: postgresConfig.originalHost
    },
    poolStatus: pool ? "iniciado" : "não iniciado",
    environment: typeof window !== 'undefined' ? 'browser' : 'node'
  };
}
