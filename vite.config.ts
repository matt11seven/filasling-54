
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
  define: {
    // Placeholders para variáveis de ambiente do Supabase
    SUPABASE_URL_PLACEHOLDER: JSON.stringify("SUPABASE_URL_PLACEHOLDER"),
    SUPABASE_ANON_KEY_PLACEHOLDER: JSON.stringify("SUPABASE_ANON_KEY_PLACEHOLDER"),
    
    // Placeholders para variáveis de ambiente do PostgreSQL direto
    DB_HOST_PLACEHOLDER: JSON.stringify("DB_HOST_PLACEHOLDER"),
    DB_USER_PLACEHOLDER: JSON.stringify("DB_USER_PLACEHOLDER"),
    DB_PASSWORD_PLACEHOLDER: JSON.stringify("DB_PASSWORD_PLACEHOLDER"),
    DB_NAME_PLACEHOLDER: JSON.stringify("DB_NAME_PLACEHOLDER"),
    DB_PORT_PLACEHOLDER: JSON.stringify("DB_PORT_PLACEHOLDER"),
  },
});
