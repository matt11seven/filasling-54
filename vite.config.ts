
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080
  },
  define: {
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
  },
});
