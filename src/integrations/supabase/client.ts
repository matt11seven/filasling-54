
// Este arquivo gerencia a conexão com o Supabase ou diretamente com PostgreSQL
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Define valores para ambientes de desenvolvimento e produção
let supabaseUrl: string;
let supabaseKey: string;
let usePostgresDirect = false;

try {
  // Always disable direct PostgreSQL in browser environments
  if (isBrowser) {
    console.log("Executando no navegador - desativando PostgreSQL direto");
    usePostgresDirect = false;
  }
  // Only check PostgreSQL direct config in Node.js environment
  else if (typeof DB_POSTGRESDB_HOST_PLACEHOLDER !== 'undefined' && 
      DB_POSTGRESDB_HOST_PLACEHOLDER !== "DB_POSTGRESDB_HOST_PLACEHOLDER" && 
      DB_POSTGRESDB_HOST_PLACEHOLDER !== "") {
    console.log("Configuração detectada para PostgreSQL direto (EasyPanel)");
    usePostgresDirect = true;
    // Não configuramos supabaseUrl/Key porque vamos usar PostgreSQL direto
  } 
  // Caso não tenha PostgreSQL configurado, tenta usar Supabase
  else if (typeof SUPABASE_URL_PLACEHOLDER !== 'undefined' && 
      SUPABASE_URL_PLACEHOLDER !== "SUPABASE_URL_PLACEHOLDER" && 
      SUPABASE_URL_PLACEHOLDER !== "") {
    // Usa valores do ambiente para Supabase
    console.log("Usando configuração do Supabase");
    supabaseUrl = SUPABASE_URL_PLACEHOLDER;
    supabaseKey = SUPABASE_ANON_KEY_PLACEHOLDER;
  } 
  // Fallback para ambiente de desenvolvimento
  else {
    // Valores de desenvolvimento hardcoded do Supabase
    console.log("Usando configuração de desenvolvimento do Supabase");
    supabaseUrl = "https://cfhjwvibgiierhvaafrd.supabase.co";
    supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmaGp3dmliZ2lpZXJodmFhZnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODI1NjcsImV4cCI6MjA1OTM1ODU2N30.3GvW0fV610dUXnQgF08XhT5EPKIwHoyfAQRgCSGN4EM";
  }
} catch (error) {
  console.error("Erro ao carregar configurações de banco de dados:", error);
  console.log("Usando configuração de fallback para continuar a execução da aplicação");
  
  // Valores de fallback para garantir que a aplicação continue
  supabaseUrl = "https://cfhjwvibgiierhvaafrd.supabase.co";
  supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmaGp3dmliZ2lpZXJodmFhZnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODI1NjcsImV4cCI6MjA1OTM1ODU2N30.3GvW0fV610dUXnQgF08XhT5EPKIwHoyfAQRgCSGN4EM";
  usePostgresDirect = false;
}

// Exporta a indicação se estamos usando PostgreSQL direto
export const isUsingPostgresDirect = usePostgresDirect;

// Exporta dados de conexão do PostgreSQL para uso direto pelos serviços (formato EasyPanel)
export const postgresConfig = {
  type: typeof DB_TYPE_PLACEHOLDER !== 'undefined' ? DB_TYPE_PLACEHOLDER : 'postgresdb',
  host: typeof DB_POSTGRESDB_HOST_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_HOST_PLACEHOLDER : 'localhost',
  user: typeof DB_POSTGRESDB_USER_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_USER_PLACEHOLDER : 'postgres',
  password: typeof DB_POSTGRESDB_PASSWORD_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_PASSWORD_PLACEHOLDER : 'postgres',
  database: typeof DB_POSTGRESDB_DATABASE_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_DATABASE_PLACEHOLDER : 'slingfila',
  port: typeof DB_POSTGRESDB_PORT_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_PORT_PLACEHOLDER : '5432'
};

// Ensure we have valid Supabase credentials before creating the client
if (!supabaseUrl) {
  supabaseUrl = "https://cfhjwvibgiierhvaafrd.supabase.co";
}
if (!supabaseKey) {
  supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmaGp3dmliZ2lpZXJodmFhZnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODI1NjcsImV4cCI6MjA1OTM1ODU2N30.3GvW0fV610dUXnQgF08XhT5EPKIwHoyfAQRgCSGN4EM";
}

// Cria cliente do Supabase com tratamento de erro
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Adiciona log para identificar qual modo está sendo usado
console.log(`Modo de conexão: ${usePostgresDirect ? 'PostgreSQL Direto' : 'Supabase'}`);
console.log("Configuração de banco:", usePostgresDirect ? {
  host: postgresConfig.host,
  user: postgresConfig.user,
  database: postgresConfig.database,
  port: postgresConfig.port
} : "Usando Supabase");
