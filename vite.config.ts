
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Define placeholders that will be replaced at runtime
    DB_HOST_PLACEHOLDER: JSON.stringify("DB_HOST_PLACEHOLDER"),
    DB_PORT_PLACEHOLDER: JSON.stringify("DB_PORT_PLACEHOLDER"),
    DB_USER_PLACEHOLDER: JSON.stringify("DB_USER_PLACEHOLDER"),
    DB_PASSWORD_PLACEHOLDER: JSON.stringify("DB_PASSWORD_PLACEHOLDER"),
    DB_NAME_PLACEHOLDER: JSON.stringify("DB_NAME_PLACEHOLDER"),
  }
}));
