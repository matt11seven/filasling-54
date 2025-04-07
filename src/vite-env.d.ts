
/// <reference types="vite/client" />

// Global variables for placeholder replacements
declare const SUPABASE_URL_PLACEHOLDER: string;
declare const SUPABASE_ANON_KEY_PLACEHOLDER: string;

// PostgreSQL environment variable placeholders
declare const DB_TYPE_PLACEHOLDER: string;
declare const DB_POSTGRESDB_HOST_PLACEHOLDER: string;
declare const DB_POSTGRESDB_USER_PLACEHOLDER: string;
declare const DB_POSTGRESDB_PASSWORD_PLACEHOLDER: string;
declare const DB_POSTGRESDB_DATABASE_PLACEHOLDER: string;
declare const DB_POSTGRESDB_PORT_PLACEHOLDER: string;

// Extensão para interface do PostgresConfig
interface PostgresConfig {
  type: string;
  host: string;
  user: string;
  password: string;
  database: string;
  port: string;
  originalHost?: string;
}
