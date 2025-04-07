
// Este arquivo gerencia a conexão com o Supabase ou diretamente com PostgreSQL
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Define valores para ambientes de desenvolvimento e produção
let supabaseUrl: string;
let supabaseKey: string;
let usePostgresDirect = false;

// Verifica primeiro se as variáveis de PostgreSQL direto estão configuradas
if (typeof DB_POSTGRESDB_HOST_PLACEHOLDER !== 'undefined' && 
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

// Exporta a indicação se estamos usando PostgreSQL direto
export const isUsingPostgresDirect = usePostgresDirect;

// Exporta dados de conexão do PostgreSQL para uso direto pelos serviços (formato EasyPanel)
export const postgresConfig = {
  type: DB_TYPE_PLACEHOLDER,
  host: DB_POSTGRESDB_HOST_PLACEHOLDER,
  user: DB_POSTGRESDB_USER_PLACEHOLDER,
  password: DB_POSTGRESDB_PASSWORD_PLACEHOLDER,
  database: DB_POSTGRESDB_DATABASE_PLACEHOLDER,
  port: DB_POSTGRESDB_PORT_PLACEHOLDER
};

// Cria cliente do Supabase apenas se não estivermos usando PostgreSQL direto
export const supabase = !usePostgresDirect 
  ? createClient<Database>(supabaseUrl, supabaseKey)
  : createClient<Database>("", ""); // Cliente vazio para evitar erros de tipo

// Adiciona log para identificar qual modo está sendo usado
console.log(`Modo de conexão: ${usePostgresDirect ? 'PostgreSQL Direto' : 'Supabase'}`);
console.log("Configuração de banco:", usePostgresDirect ? {
  host: postgresConfig.host,
  user: postgresConfig.user,
  database: postgresConfig.database,
  port: postgresConfig.port
} : "Usando Supabase");
