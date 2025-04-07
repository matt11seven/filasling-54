
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Recupera variáveis do .env em modo de desenvolvimento
  const devEnv = {
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || '5432',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
    DB_NAME: process.env.DB_NAME || 'slingfila'
  };

  console.log('Modo de construção:', mode);
  console.log('Variáveis de ambiente para desenvolvimento:', {
    ...devEnv,
    DB_PASSWORD: '********' // Não exibe senha real nos logs
  });

  return {
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
      // Em desenvolvimento, use variáveis do .env
      // Em produção, mantenha os placeholders que serão substituídos em runtime pelo env.sh
      DB_HOST_PLACEHOLDER: mode === 'development' 
        ? JSON.stringify(devEnv.DB_HOST) 
        : JSON.stringify("DB_HOST_PLACEHOLDER"),
      DB_PORT_PLACEHOLDER: mode === 'development'
        ? JSON.stringify(devEnv.DB_PORT)
        : JSON.stringify("DB_PORT_PLACEHOLDER"),
      DB_USER_PLACEHOLDER: mode === 'development'
        ? JSON.stringify(devEnv.DB_USER)
        : JSON.stringify("DB_USER_PLACEHOLDER"),
      DB_PASSWORD_PLACEHOLDER: mode === 'development'
        ? JSON.stringify(devEnv.DB_PASSWORD)
        : JSON.stringify("DB_PASSWORD_PLACEHOLDER"),
      DB_NAME_PLACEHOLDER: mode === 'development'
        ? JSON.stringify(devEnv.DB_NAME)
        : JSON.stringify("DB_NAME_PLACEHOLDER"),
      // Meta informações para diagnóstico
      'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version || 'dev'),
      // Polyfill para Node.js process no navegador
      'process.env': JSON.stringify({}),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.platform': JSON.stringify('browser'),
      'process.version': JSON.stringify(''),
      'process': JSON.stringify({
        env: {},
        platform: 'browser',
        version: '',
        nextTick: (cb: any) => setTimeout(cb, 0)
      })
    }
  };
});
