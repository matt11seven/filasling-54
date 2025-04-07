
import { isUsingPostgresDirect, resetConnectionCache, postgresConfig } from "@/integrations/supabase/client";
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
    
    // Exibir informações de configuração no console para diagnóstico
    console.log("Testando conexão com as seguintes configurações:", {
      modo: isUsingPostgresDirect ? "PostgreSQL Direto" : "Supabase (fallback)",
      host: postgresConfig.host,
      port: postgresConfig.port,
      database: postgresConfig.database,
      user: postgresConfig.user
    });
    
    // Verificar se a configuração parece válida
    if (postgresConfig.host === "DB_POSTGRESDB_HOST_PLACEHOLDER" || 
        !postgresConfig.host || 
        postgresConfig.host === "") {
      toast.error("Configuração de banco inválida: host não definido");
      console.error("❌ Configuração inválida: HOST não está definido corretamente");
      console.error("Valores recebidos:", postgresConfig);
      return false;
    }
    
    if (isUsingPostgresDirect) {
      // Mostrar toast informativo antes de iniciar o teste
      toast.info(`Testando conexão com PostgreSQL (${postgresConfig.host})...`);
      
      // Testa conexão direta com PostgreSQL com timeout
      const connectionPromise = checkConnection();
      
      // Adicionar timeout para não bloquear a UI por muito tempo
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          toast.error(`Timeout ao tentar conectar ao PostgreSQL (${postgresConfig.host})`);
          console.error(`❌ Timeout na conexão com PostgreSQL ${postgresConfig.host}:${postgresConfig.port}`);
          resolve(false);
        }, 5000);
      });
      
      // Usar Promise.race para garantir que não bloqueie por muito tempo
      const isConnected = await Promise.race([connectionPromise, timeoutPromise]);
      
      if (isConnected) {
        toast.success(`Conexão com PostgreSQL estabelecida com sucesso! (${postgresConfig.host})`);
        console.log(`✅ Conexão com PostgreSQL ${postgresConfig.host} funcionando`);
        return true;
      } else {
        toast.error(`Falha ao conectar ao PostgreSQL (${postgresConfig.host})`);
        console.error(`❌ Falha na conexão com PostgreSQL ${postgresConfig.host}:${postgresConfig.port}`);
        
        // Verificar configurações para diagnóstico
        if (postgresConfig.host === "db") {
          console.warn("⚠️ Você está usando 'db' como hostname. Se estiver fora do contêiner Docker, isso não vai funcionar.");
          console.warn("⚠️ Utilize o IP ou hostname real do servidor PostgreSQL.");
          toast.error("Hostname 'db' não resolve fora do Docker. Use IP ou hostname real.");
        }
        
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
 * Retorna as configurações de conexão atuais (para diagnóstico)
 */
export const getConnectionConfig = (): object => {
  // Omitir a senha por segurança
  return {
    type: postgresConfig.type,
    host: postgresConfig.host,
    port: postgresConfig.port,
    database: postgresConfig.database,
    user: postgresConfig.user,
    hasPassword: Boolean(postgresConfig.password),
  };
};

/**
 * Reinicia a conexão com o banco de dados
 */
export const resetConnection = (): void => {
  resetConnectionCache();
  resetPool();
  toast.info("Conexão com banco de dados reiniciada");
};
