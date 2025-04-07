
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
    
    // Exibir informações detalhadas de configuração para diagnóstico
    console.log("Testando conexão com as seguintes configurações:", {
      modo: isUsingPostgresDirect ? "PostgreSQL Direto" : "Supabase (fallback)",
      host: postgresConfig.host,
      port: postgresConfig.port,
      database: postgresConfig.database,
      user: postgresConfig.user,
      hostRaw: typeof DB_POSTGRESDB_HOST_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_HOST_PLACEHOLDER : 'não disponível',
      hostRawType: typeof DB_POSTGRESDB_HOST_PLACEHOLDER,
      originalHost: postgresConfig.originalHost || postgresConfig.host
    });
    
    // Verificar se a configuração parece válida
    if (postgresConfig.host === "DB_POSTGRESDB_HOST_PLACEHOLDER" || 
        !postgresConfig.host || 
        postgresConfig.host === "") {
      toast.error("Configuração de banco inválida: host não definido", {
        description: `Verifique se as variáveis de ambiente estão configuradas corretamente no seu .env. 
                     Valor recebido: "${postgresConfig.host}" (${typeof postgresConfig.host})`,
        duration: 15000
      });
      console.error("❌ Configuração inválida: HOST não está definido corretamente");
      console.error("Valores recebidos:", postgresConfig);
      console.error("Valor raw do placeholder:", DB_POSTGRESDB_HOST_PLACEHOLDER);
      return false;
    }
    
    if (isUsingPostgresDirect) {
      // Mostrar toast informativo antes de iniciar o teste
      toast.info(`Testando conexão com PostgreSQL (${postgresConfig.host})...`, {
        duration: 3000
      });
      
      // Verificar se o hostname contém underscores
      if (postgresConfig.host.includes("_")) {
        console.warn("⚠️ O hostname contém underscores (_): " + postgresConfig.host);
        toast.warning("Hostname contém underscores (_)", {
          description: "Em alguns ambientes, hostnames com underscores podem causar problemas de resolução DNS. Se a conexão falhar, tente usar o endereço IP em vez do nome do host.",
          duration: 15000
        });
      }
      
      // Testa conexão direta com PostgreSQL com timeout
      const connectionPromise = checkConnection();
      
      // Adicionar timeout para não bloquear a UI por muito tempo
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          toast.error(`Timeout ao tentar conectar ao PostgreSQL (${postgresConfig.host})`, {
            description: `Verifique se o servidor PostgreSQL está em execução e acessível.
                          Host: ${postgresConfig.host}
                          Porta: ${postgresConfig.port}
                          Usuário: ${postgresConfig.user}
                          Database: ${postgresConfig.database}`,
            duration: 15000
          });
          console.error(`❌ Timeout na conexão com PostgreSQL ${postgresConfig.host}:${postgresConfig.port}`);
          resolve(false);
        }, 12000); // Aumentando o timeout para 12 segundos
      });
      
      // Usar Promise.race para garantir que não bloqueie por muito tempo
      const isConnected = await Promise.race([connectionPromise, timeoutPromise]);
      
      if (isConnected) {
        toast.success(`Conexão com PostgreSQL estabelecida com sucesso! (${postgresConfig.host})`, {
          description: "O banco de dados está acessível e respondendo corretamente",
          duration: 5000
        });
        console.log(`✅ Conexão com PostgreSQL ${postgresConfig.host} funcionando`);
        return true;
      } else {
        toast.error(`Falha ao conectar ao PostgreSQL (${postgresConfig.host})`, {
          description: `Verifique as credenciais, firewall e se o servidor está em execução.
                        Host: ${postgresConfig.host}
                        Porta: ${postgresConfig.port}
                        Usuário: ${postgresConfig.user}
                        Database: ${postgresConfig.database}`,
          duration: 15000
        });
        console.error(`❌ Falha na conexão com PostgreSQL ${postgresConfig.host}:${postgresConfig.port}`);
        
        // Verificar configurações para diagnóstico
        if (postgresConfig.host.includes("_")) {
          console.warn("⚠️ O hostname contém underscores (_). Verifique se o DNS resolve corretamente esse formato.");
          console.warn("⚠️ Em alguns ambientes, hostnames com underscores podem causar problemas de resolução DNS.");
          toast.error("Hostname contém underscores (_) que podem causar problemas de resolução DNS.", {
            description: "Tente substituir o nome do host pelo endereço IP diretamente no arquivo .env - por exemplo, consulte o administrador para obter o IP correto do servidor de banco de dados.",
            duration: 10000
          });
        }
        
        return false;
      }
    } else {
      // No caso do Supabase (fallback), mostramos uma mensagem diferente
      toast.error("PostgreSQL direto não configurado. Configure as variáveis de ambiente.", {
        description: "Adicione as variáveis DB_POSTGRESDB_HOST, DB_POSTGRESDB_USER, etc. no seu .env",
        duration: 10000
      });
      console.error("⚠️ PostgreSQL direto não configurado");
      return false;
    }
  } catch (error) {
    console.error("Erro ao testar conexão:", error);
    toast.error("Erro ao testar conexão com o banco de dados", {
      description: `Erro: ${error instanceof Error ? error.message : String(error)}`,
      duration: 10000
    });
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
    // Adicionar valores brutos dos placeholders para diagnóstico
    rawPlaceholders: {
      hostPlaceholder: typeof DB_POSTGRESDB_HOST_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_HOST_PLACEHOLDER : 'não disponível',
      hostPlaceholderType: typeof DB_POSTGRESDB_HOST_PLACEHOLDER,
      userPlaceholder: typeof DB_POSTGRESDB_USER_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_USER_PLACEHOLDER : 'não disponível',
      databasePlaceholder: typeof DB_POSTGRESDB_DATABASE_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_DATABASE_PLACEHOLDER : 'não disponível',
      portPlaceholder: typeof DB_POSTGRESDB_PORT_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_PORT_PLACEHOLDER : 'não disponível'
    },
    // Adicionar informação sobre o hostname original (antes de processamento)
    originalHost: postgresConfig.originalHost || postgresConfig.host
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

/**
 * Tenta sugerir soluções para problemas de conexão
 */
export const getSuggestedFixes = (): string[] => {
  const suggestions: string[] = [];
  
  // Adicionar sugestões específicas baseadas na configuração atual
  if (postgresConfig.host.includes('_')) {
    suggestions.push("Substitua o hostname com underscores por seu endereço IP equivalente no arquivo .env");
    suggestions.push("Verifique se o servidor de banco de dados está acessível na sua rede");
  }
  
  // Adicionar sugestões gerais
  suggestions.push("Verifique se o firewall permite conexões para a porta do PostgreSQL");
  suggestions.push("Confirme se as credenciais de acesso ao banco estão corretas");
  suggestions.push("Verifique se o banco de dados está em execução");
  
  return suggestions;
};
