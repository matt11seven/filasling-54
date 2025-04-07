
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
    console.warn("⚠️ Tentando normalizar hostname para compatibilidade DNS");
    
    // Em alguns ambientes, podemos tentar substituir underscore por hífen
    // Esta é uma tentativa, não uma solução garantida
    // const normalizedHostname = hostname.replace(/_/g, '-');
    // console.warn(`⚠️ Hostname normalizado: ${normalizedHostname}`);
    // return normalizedHostname;
    
    // Por enquanto, vamos apenas retornar o hostname original,
    // mas deixamos o código de normalização comentado caso seja necessário
  }
  return hostname;
}

try {
  // Always prioritize PostgreSQL in browser environments too
  if (isBrowser) {
    console.log("Executando no navegador - PostgreSQL direto será priorizado");
    
    // Verificar se temos informações em localStorage para evitar conexão com banco antigo
    const cachedConnection = localStorage.getItem('db_connection_info');
    if (cachedConnection) {
      const connection = JSON.parse(cachedConnection);
      console.log("Limpando informações de conexão em cache:", connection.url);
      localStorage.removeItem('db_connection_info');
    }
  }
  
  // Verificar se temos configuração para PostgreSQL direto
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
      hostType: typeof originalHost
    });
    
    usePostgresDirect = true;
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

// Exporta dados de conexão do PostgreSQL para uso direto pelos serviços (formato EasyPanel)
export const postgresConfig = {
  type: typeof DB_TYPE_PLACEHOLDER !== 'undefined' ? DB_TYPE_PLACEHOLDER : 'postgresdb',
  host: processedHost, // Usando a versão processada do hostname
  user: typeof DB_POSTGRESDB_USER_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_USER_PLACEHOLDER : 'postgres',
  password: typeof DB_POSTGRESDB_PASSWORD_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_PASSWORD_PLACEHOLDER : 'postgres',
  database: typeof DB_POSTGRESDB_DATABASE_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_DATABASE_PLACEHOLDER : 'slingfila',
  port: typeof DB_POSTGRESDB_PORT_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_PORT_PLACEHOLDER : '5432',
  originalHost: originalHost // Mantemos o host original para diagnóstico
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
  port: postgresConfig.port
});

// Verificar se o hostname contém underscores
if (postgresConfig.host.includes('_')) {
  console.warn("⚠️ O hostname do PostgreSQL contém underscores (_): " + postgresConfig.host);
  console.warn("⚠️ Em alguns ambientes, isso pode causar problemas de resolução DNS.");
  console.warn("⚠️ Se a conexão falhar, considere usar o endereço IP do servidor diretamente.");
  
  // Verificar se estamos em um ambiente que suporta DNS lookup
  if (typeof window !== 'undefined' && 'require' in window) {
    try {
      console.log("Tentando realizar lookup de DNS para o hostname...");
      // Este código só funcionará em ambientes Node.js, não no navegador
      // const dns = require('dns');
      // dns.lookup(postgresConfig.host, (err, address) => {
      //   if (err) {
      //     console.error("Erro ao resolver hostname:", err);
      //   } else {
      //     console.log("Hostname resolvido para IP:", address);
      //   }
      // });
    } catch (error) {
      console.error("Erro ao tentar resolver hostname:", error);
    }
  }
}
