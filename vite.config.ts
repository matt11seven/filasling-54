
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Gerar uma versão baseada no timestamp atual
const appVersion = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080
  },
  define: {
    // Versão da aplicação para controle de cache
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    
    // Placeholders para variáveis de ambiente do Supabase
    SUPABASE_URL_PLACEHOLDER: JSON.stringify("SUPABASE_URL_PLACEHOLDER"),
    SUPABASE_ANON_KEY_PLACEHOLDER: JSON.stringify("SUPABASE_ANON_KEY_PLACEHOLDER"),
    
    // Placeholders para variáveis de ambiente do PostgreSQL usando formato EasyPanel
    DB_TYPE_PLACEHOLDER: JSON.stringify("DB_TYPE_PLACEHOLDER"),
    DB_POSTGRESDB_HOST_PLACEHOLDER: JSON.stringify("DB_POSTGRESDB_HOST_PLACEHOLDER"),
    DB_POSTGRESDB_USER_PLACEHOLDER: JSON.stringify("DB_POSTGRESDB_USER_PLACEHOLDER"),
    DB_POSTGRESDB_PASSWORD_PLACEHOLDER: JSON.stringify("DB_POSTGRESDB_PASSWORD_PLACEHOLDER"),
    DB_POSTGRESDB_DATABASE_PLACEHOLDER: JSON.stringify("DB_POSTGRESDB_DATABASE_PLACEHOLDER"),
    DB_POSTGRESDB_PORT_PLACEHOLDER: JSON.stringify("DB_POSTGRESDB_PORT_PLACEHOLDER"),
    
    // Flag para indicar ambiente Docker
    IS_DOCKER_ENV_PLACEHOLDER: JSON.stringify("IS_DOCKER_ENV_PLACEHOLDER"),
    
    // Melhor polyfill para process.env
    "process.env": "{}",
    "global": "globalThis",
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
  },
}));
