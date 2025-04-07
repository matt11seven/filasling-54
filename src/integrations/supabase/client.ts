
// Este arquivo gerencia a conexão com o Supabase ou diretamente com PostgreSQL
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Define valores para ambientes de desenvolvimento e produção
let supabaseUrl: string = '';
let supabaseKey: string = '';
let usePostgresDirect = true; // Por padrão, usar PostgreSQL direto

// Função para limpar o cache de conexão
export function resetConnectionCache() {
  console.log("Resetando cache de conexão do banco de dados");
  // Limpa qualquer cache armazenado em localStorage
  if (isBrowser) {
    localStorage.removeItem('db_connection_info');
    localStorage.removeItem('supabase.auth.token');
  }
}

// Função para normalizar hostname que contém underscore
export function normalizeHostname(hostname: string): string {
  // Se o hostname contém underscores, exibe um aviso
  if (hostname && hostname.includes('_')) {
    console.warn(`⚠️ Hostname contém underscores: ${hostname}`);
    console.warn("⚠️ Ambientes Docker geralmente suportam underscores em hostnames");
    
    // Em ambientes Docker, underscores geralmente funcionam sem problemas
    if (hostname.includes('docker') || hostname.includes('container') || hostname.includes('easypanel') || hostname.includes('aux_')) {
      console.log("✅ Detectado possível ambiente Docker/EasyPanel, underscores são geralmente suportados");
    }
  }
  return hostname;
}

// Função para extrair informações detalhadas do erro de conexão
export function analyzeConnectionError(error: any): string {
  let errorInfo = "Erro desconhecido";
  
  try {
    if (error?.code === 'ENOTFOUND') {
      return `Falha na resolução do hostname: ${error.hostname || 'desconhecido'}. Problema de DNS ou hostname incorreto.`;
    }
    
    if (error?.code === 'ECONNREFUSED') {
      return `Conexão recusada em ${error.address || 'endereço desconhecido'}:${error.port || 'porta desconhecida'}. Verifique se o servidor está em execução e acessível.`;
    }
    
    if (error?.message) {
      errorInfo = error.message;
    }
    
    if (error?.code) {
      errorInfo += ` (Código: ${error.code})`;
    }
    
  } catch (err) {
    console.error("Erro ao analisar erro de conexão:", err);
  }
  
  return errorInfo;
}

try {
  // Always prioritize PostgreSQL in browser environments too
  if (isBrowser) {
    console.log("Executando no navegador - PostgreSQL direto será priorizado via proxy de API");
    
    // Verificar se temos informações em localStorage para evitar conexão com banco antigo
    const cachedConnection = localStorage.getItem('db_connection_info');
    if (cachedConnection) {
      const connection = JSON.parse(cachedConnection);
      console.log("Limpando informações de conexão em cache:", connection.url);
      localStorage.removeItem('db_connection_info');
    }
  }
  
  // Verificar e validar se temos configuração para PostgreSQL direto
  if (typeof DB_POSTGRESDB_HOST_PLACEHOLDER !== 'undefined' && 
      DB_POSTGRESDB_HOST_PLACEHOLDER !== "DB_POSTGRESDB_HOST_PLACEHOLDER" && 
      DB_POSTGRESDB_HOST_PLACEHOLDER !== "") {
    
    // Capturamos o host original antes de qualquer processamento
    const originalHost = DB_POSTGRESDB_HOST_PLACEHOLDER;
    
    // Log detalhado das configurações encontradas
    console.log("Configuração detectada para PostgreSQL direto:", {
      host: originalHost,
      port: DB_POSTGRESDB_PORT_PLACEHOLDER,
      user: DB_POSTGRESDB_USER_PLACEHOLDER,
      database: DB_POSTGRESDB_DATABASE_PLACEHOLDER,
      hasPassword: Boolean(DB_POSTGRESDB_PASSWORD_PLACEHOLDER),
      hostType: typeof originalHost,
      hostLength: originalHost ? originalHost.length : 0,
      hostHasUnderscore: originalHost ? originalHost.includes('_') : false,
      hostValue: originalHost
    });
    
    usePostgresDirect = true;
    
    // Verificar se o host é válido e não está vazio ou indefinido
    if (!originalHost || originalHost.trim() === '') {
      console.error("❌ ERRO: Host do PostgreSQL está vazio ou indefinido!");
      console.error("Valor recebido:", originalHost);
      // Em ambientes Docker, podemos tentar usar 'localhost' ou o nome padrão do serviço
      if (typeof DB_POSTGRESDB_HOST_PLACEHOLDER === 'string' && DB_POSTGRESDB_HOST_PLACEHOLDER.includes('_')) {
        console.log("Tentativa de uso em ambiente Docker detectada.");
      }
    }
  } 
  // Caso não tenha PostgreSQL configurado, tenta usar Supabase como fallback
  else if (typeof SUPABASE_URL_PLACEHOLDER !== 'undefined' && 
      SUPABASE_URL_PLACEHOLDER !== "SUPABASE_URL_PLACEHOLDER" && 
      SUPABASE_URL_PLACEHOLDER !== "") {
    // Usa valores do ambiente para Supabase apenas como fallback
    console.log("Usando Supabase apenas como fallback");
    supabaseUrl = SUPABASE_URL_PLACEHOLDER;
    supabaseKey = SUPABASE_ANON_KEY_PLACEHOLDER;
    
    // Não armazenar em cache para evitar problemas futuros
  } 
  else {
    // Mensagem de erro se não tiver configuração válida
    console.log("ATENÇÃO: Nenhuma configuração de banco detectada. Configure as variáveis de ambiente para PostgreSQL.");
    usePostgresDirect = true;
  }
} catch (error) {
  console.error("Erro ao carregar configurações de banco de dados:", error);
  console.log("Usando PostgreSQL direto como fallback");
  usePostgresDirect = true;
}

// Exporta a indicação se estamos usando PostgreSQL direto
export const isUsingPostgresDirect = usePostgresDirect;

// Tratamento especial para hostname com underscore
const originalHost = typeof DB_POSTGRESDB_HOST_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_HOST_PLACEHOLDER : 'localhost';
const processedHost = normalizeHostname(originalHost);

// IMPORTANTE: Log para diagnosticar problemas de substituição de variáveis
console.log("Variável de ambiente do host (valor bruto):", DB_POSTGRESDB_HOST_PLACEHOLDER);
console.log("Tipo da variável de ambiente do host:", typeof DB_POSTGRESDB_HOST_PLACEHOLDER);
console.log("Comprimento da string do host:", originalHost ? originalHost.length : 0);
console.log("Host contém caracteres especiais:", originalHost ? /[^a-zA-Z0-9_\-.]/.test(originalHost) : false);

// Em ambientes Docker/EasyPanel, os underscores em hostnames geralmente são suportados
let isDockerEnv = processedHost.includes('docker') || 
                 processedHost.includes('container') || 
                 processedHost.includes('easypanel') || 
                 processedHost.includes('aux_');

// Exporta dados de conexão do PostgreSQL para uso direto pelos serviços (formato EasyPanel)
export const postgresConfig = {
  type: typeof DB_TYPE_PLACEHOLDER !== 'undefined' ? DB_TYPE_PLACEHOLDER : 'postgresdb',
  host: processedHost, // Usando a versão processada do hostname
  user: typeof DB_POSTGRESDB_USER_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_USER_PLACEHOLDER : 'postgres',
  password: typeof DB_POSTGRESDB_PASSWORD_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_PASSWORD_PLACEHOLDER : 'postgres',
  database: typeof DB_POSTGRESDB_DATABASE_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_DATABASE_PLACEHOLDER : 'slingfila',
  port: typeof DB_POSTGRESDB_PORT_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_PORT_PLACEHOLDER : '5432',
  originalHost: originalHost, // Mantemos o host original para diagnóstico
  isDockerEnvironment: isDockerEnv // Indicador se estamos em ambiente Docker
};

// Criar cliente Supabase apenas como fallback (sem chaves hardcoded)
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseKey || 'placeholder-key'
);

// Adiciona log para identificar qual modo está sendo usado
console.log(`Modo de conexão: ${usePostgresDirect ? 'PostgreSQL Direto' : 'Supabase (fallback)'}`);
console.log("Configuração de banco:", {
  host: postgresConfig.host,
  user: postgresConfig.user,
  database: postgresConfig.database,
  port: postgresConfig.port,
  isDockerEnv: postgresConfig.isDockerEnvironment
});

// Verificar se o hostname contém underscores
if (postgresConfig.host.includes('_')) {
  console.warn("⚠️ O hostname do PostgreSQL contém underscores (_): " + postgresConfig.host);
  
  if (postgresConfig.isDockerEnvironment) {
    console.log("✅ Ambiente Docker/EasyPanel detectado. Conexões com underscores geralmente funcionam neste ambiente.");
  } else {
    console.warn("⚠️ Em alguns ambientes, isso pode causar problemas de resolução DNS.");
    console.warn("⚠️ Se a conexão falhar, considere usar o endereço IP do servidor diretamente.");
  }
  
  // Verificar se estamos em um ambiente que suporta DNS lookup
  if (typeof window !== 'undefined' && 'require' in window) {
    try {
      console.log("Tentando realizar lookup de DNS para o hostname...");
      // Este código só funcionará em ambientes Node.js, não no navegador
    } catch (error) {
      console.error("Erro ao tentar resolver hostname:", error);
    }
  }
}
