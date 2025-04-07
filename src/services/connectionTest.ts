
import { testConnection, resetPool } from '@/integrations/postgres/client';

interface ConnectionStatus {
  connected: boolean;
  message: string;
  error?: string;
  diagnostics?: Record<string, any>;
}

export const checkDatabaseConnection = async (): Promise<ConnectionStatus> => {
  try {
    // Check connection to PostgreSQL
    const connected = await testConnection();
    
    if (connected) {
      return {
        connected: true,
        message: "Conexão com o banco de dados estabelecida com sucesso."
      };
    } else {
      // Try to gather diagnostic information
      let diagnostics: Record<string, any> = {};
      
      // Check environment variables
      try {
        diagnostics = {
          type: "postgresdb",
          host: typeof DB_HOST_PLACEHOLDER !== 'undefined' 
            ? DB_HOST_PLACEHOLDER 
            : "não configurado",
          port: typeof DB_PORT_PLACEHOLDER !== 'undefined' 
            ? DB_PORT_PLACEHOLDER 
            : "não configurado",
          database: typeof DB_NAME_PLACEHOLDER !== 'undefined' 
            ? DB_NAME_PLACEHOLDER 
            : "não configurado",
          user: typeof DB_USER_PLACEHOLDER !== 'undefined' 
            ? DB_USER_PLACEHOLDER 
            : "não configurado",
          hasPassword: typeof DB_PASSWORD_PLACEHOLDER !== 'undefined' && 
            DB_PASSWORD_PLACEHOLDER !== "DB_PASSWORD_PLACEHOLDER" && 
            DB_PASSWORD_PLACEHOLDER !== ""
        };
      } catch (envError) {
        console.error("Erro ao verificar variáveis de ambiente:", envError);
      }
      
      return {
        connected: false,
        message: "Não foi possível conectar ao banco de dados.",
        error: "Verifique se as variáveis de ambiente estão configuradas corretamente no seu .env.",
        diagnostics
      };
    }
  } catch (error) {
    return {
      connected: false,
      message: "Erro ao tentar conectar ao banco de dados.",
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

export const resetDatabaseConnection = async (): Promise<ConnectionStatus> => {
  try {
    resetPool();
    return await checkDatabaseConnection();
  } catch (error) {
    return {
      connected: false,
      message: "Erro ao reiniciar conexão com o banco de dados.",
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
