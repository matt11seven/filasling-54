
import { isUsingPostgresDirect, resetConnectionCache } from "@/integrations/supabase/client";
import { checkConnection, resetPool } from "@/integrations/postgres/client";
import { toast } from "sonner";

/**
 * Testa a conexão com o banco de dados e exibe um toast com o resultado
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Limpar cache de conexão primeiro
    resetConnectionCache();
    resetPool();
    
    if (isUsingPostgresDirect) {
      // Testa conexão direta com PostgreSQL com timeout
      const connectionPromise = checkConnection();
      
      // Adicionar timeout para não bloquear a UI por muito tempo
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          toast.error("Timeout ao tentar conectar ao PostgreSQL");
          console.error("❌ Timeout na conexão com PostgreSQL");
          resolve(false);
        }, 5000);
      });
      
      // Usar Promise.race para garantir que não bloqueie por muito tempo
      const isConnected = await Promise.race([connectionPromise, timeoutPromise]);
      
      if (isConnected) {
        toast.success("Conexão com PostgreSQL estabelecida com sucesso!");
        console.log("✅ Conexão com PostgreSQL funcionando");
        return true;
      } else {
        toast.error("Falha ao conectar ao PostgreSQL");
        console.error("❌ Falha na conexão com PostgreSQL");
        return false;
      }
    } else {
      // No caso do Supabase (fallback), mostramos uma mensagem diferente
      toast.error("PostgreSQL direto não configurado. Configure as variáveis de ambiente.");
      console.error("⚠️ PostgreSQL direto não configurado");
      return false;
    }
  } catch (error) {
    console.error("Erro ao testar conexão:", error);
    toast.error("Erro ao testar conexão com o banco de dados");
    return false;
  }
};

/**
 * Retorna uma string com o modo de conexão atual
 */
export const getConnectionMode = (): string => {
  return isUsingPostgresDirect ? "PostgreSQL Direto" : "Supabase (fallback)";
};

/**
 * Reinicia a conexão com o banco de dados
 */
export const resetConnection = (): void => {
  resetConnectionCache();
  resetPool();
  toast.info("Conexão com banco de dados reiniciada");
};

/**
 * Retorna informações de diagnóstico sobre a conexão
 */
export const getDatabaseDiagnostics = async (): Promise<string> => {
  try {
    // Capturar informações do ambiente
    const envInfo = {
      DB_TYPE: process.env.DB_TYPE || 'Não definido',
      DB_HOST: process.env.DB_POSTGRESDB_HOST || 'Não definido',
      DB_PORT: process.env.DB_POSTGRESDB_PORT || 'Não definido',
      DB_NAME: process.env.DB_POSTGRESDB_DATABASE || 'Não definido',
      DB_USER: process.env.DB_POSTGRESDB_USER || 'Não definido',
      CONNECTION_MODE: getConnectionMode(),
      NODE_ENV: process.env.NODE_ENV || 'Não definido',
      TIMESTAMP: new Date().toISOString()
    };
    
    // Tentar conexão
    const isConnected = await testDatabaseConnection();
    
    // Formatar relatório
    const report = `
=== DIAGNÓSTICO DE CONEXÃO ===
Timestamp: ${envInfo.TIMESTAMP}
Modo de conexão: ${envInfo.CONNECTION_MODE}
Ambiente: ${envInfo.NODE_ENV}
Tipo de BD: ${envInfo.DB_TYPE}
Host: ${envInfo.DB_HOST}
Porta: ${envInfo.DB_PORT}
Banco: ${envInfo.DB_NAME}
Usuário: ${envInfo.DB_USER}
Status da conexão: ${isConnected ? '✅ CONECTADO' : '❌ FALHA'}
============================
    `;
    
    console.log(report);
    return report;
  } catch (error) {
    console.error("Erro ao gerar diagnóstico:", error);
    return `Erro ao gerar diagnóstico: ${error}`;
  }
};
