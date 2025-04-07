
// Este arquivo gerencia a conexão com o Supabase ou diretamente com PostgreSQL
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Define valores para ambientes de desenvolvimento e produção
let supabaseUrl: string;
let supabaseKey: string;
let usePostgresDirect = false;

// Verifica se os valores são placeholders ou se estamos usando PostgreSQL direto
if (typeof SUPABASE_URL_PLACEHOLDER === 'undefined' || 
    SUPABASE_URL_PLACEHOLDER === "SUPABASE_URL_PLACEHOLDER" || 
    SUPABASE_URL_PLACEHOLDER === "") {
  
  // Verifica se as variáveis de PostgreSQL direto estão configuradas
  if (typeof DB_HOST_PLACEHOLDER !== 'undefined' && 
      DB_HOST_PLACEHOLDER !== "DB_HOST_PLACEHOLDER" && 
      DB_HOST_PLACEHOLDER !== "") {
    console.log("Configuração detectada para PostgreSQL direto");
    usePostgresDirect = true;
    
    // Aqui não configuramos supabaseUrl/Key porque vamos usar PostgreSQL direto
    // Os serviços precisarão verificar usePostgresDirect
  } else {
    // Fallback para valores de desenvolvimento hardcoded do Supabase
    console.log("Usando configuração de desenvolvimento do Supabase");
    supabaseUrl = "https://cfhjwvibgiierhvaafrd.supabase.co";
    supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmaGp3dmliZ2lpZXJodmFhZnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODI1NjcsImV4cCI6MjA1OTM1ODU2N30.3GvW0fV610dUXnQgF08XhT5EPKIwHoyfAQRgCSGN4EM";
  }
} else {
  // Usa valores do ambiente para produção (serão substituídos por env.sh)
  console.log("Usando configuração de produção do Supabase");
  supabaseUrl = SUPABASE_URL_PLACEHOLDER;
  supabaseKey = SUPABASE_ANON_KEY_PLACEHOLDER;
}

// Exporta a indicação se estamos usando PostgreSQL direto
export const isUsingPostgresDirect = usePostgresDirect;

// Exporta dados de conexão do PostgreSQL para uso direto pelos serviços
export const postgresConfig = {
  host: DB_HOST_PLACEHOLDER,
  user: DB_USER_PLACEHOLDER,
  password: DB_PASSWORD_PLACEHOLDER,
  database: DB_NAME_PLACEHOLDER,
  port: DB_PORT_PLACEHOLDER
};

// Cria cliente do Supabase apenas se não estivermos usando PostgreSQL direto
export const supabase = !usePostgresDirect 
  ? createClient<Database>(supabaseUrl, supabaseKey)
  : createClient<Database>("", ""); // Cliente vazio para evitar erros de tipo
