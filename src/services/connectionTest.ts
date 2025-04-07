
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
      // No caso do Supabase, podemos testar com uma consulta simples
      toast.info("Usando Supabase em vez de PostgreSQL direto");
      console.log("ℹ️ Modo Supabase ativo");
      return true;
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
  return isUsingPostgresDirect ? "PostgreSQL Direto" : "Supabase";
};

/**
 * Reinicia a conexão com o banco de dados
 */
export const resetConnection = (): void => {
  resetConnectionCache();
  resetPool();
  toast.info("Conexão com banco de dados reiniciada");
};
