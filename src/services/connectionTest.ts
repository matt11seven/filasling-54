
import { isUsingPostgresDirect, resetConnectionCache, postgresConfig } from "@/integrations/supabase/client";
import { checkConnection, resetPool, tryAlternativeConnection, getConnectionDiagnostics } from "@/integrations/postgres/client";
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
      originalHost: postgresConfig.originalHost || postgresConfig.host,
      isDockerEnv: postgresConfig.isDockerEnvironment
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
    
    // Verificar se os valores das variáveis de ambiente foram substituídos corretamente
    if (postgresConfig.host.includes("PLACEHOLDER") || 
        postgresConfig.user.includes("PLACEHOLDER") || 
        postgresConfig.database.includes("PLACEHOLDER")) {
      toast.error("Erro na substituição de variáveis de ambiente", {
        description: "As variáveis de ambiente não foram substituídas corretamente no build. Verifique o processo de build e deploy.",
        duration: 15000
      });
      console.error("❌ Erro na substituição de variáveis de ambiente:", postgresConfig);
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
        
        if (postgresConfig.isDockerEnvironment) {
          console.log("✅ Ambiente Docker/EasyPanel detectado, underscores geralmente são válidos");
        } else {
          toast.warning("Hostname contém underscores (_)", {
            description: "Em alguns ambientes, hostnames com underscores podem causar problemas de resolução DNS. Se a conexão falhar, tente usar o endereço IP em vez do nome do host.",
            duration: 15000
          });
        }
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
        // Tentar estratégia alternativa para ambientes Docker
        if (postgresConfig.isDockerEnvironment) {
          toast.info("Tentando abordagem alternativa para ambiente Docker...", {
            duration: 5000
          });
          
          const altResult = await tryAlternativeConnection();
          if (altResult) {
            toast.success("Conexão alternativa estabelecida com sucesso!", {
              description: "Usando abordagem específica para Docker",
              duration: 5000
            });
            return true;
          }
        }
        
        toast.error(`Falha ao conectar ao PostgreSQL (${postgresConfig.host})`, {
          description: `Verifique as credenciais, firewall e se o servidor está em execução.
                        Host: ${postgresConfig.host}
                        Porta: ${postgresConfig.port}
                        Usuário: ${postgresConfig.user}
                        Database: ${postgresConfig.database}`,
          duration: 15000
        });
        console.error(`❌ Falha na conexão com PostgreSQL ${postgresConfig.host}:${postgresConfig.port}`);
        
        // Verificar se é ambiente Docker com underscores
        if (postgresConfig.host.includes('_') && postgresConfig.isDockerEnvironment) {
          console.log("⚠️ Ambiente Docker com hostname contendo underscores");
          console.log("⚠️ Sugestão: Verifique se o nome do serviço está correto na rede Docker");
          
          toast.warning("Ambiente Docker com hostname contendo underscores", {
            description: "Verifique se o nome do serviço está correto na rede Docker e se os containers estão na mesma rede",
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
  // Obter diagnósticos detalhados
  const diagnostics = getConnectionDiagnostics();
  
  // Omitir a senha por segurança
  return {
    type: postgresConfig.type,
    host: postgresConfig.host,
    port: postgresConfig.port,
    database: postgresConfig.database,
    user: postgresConfig.user,
    hasPassword: Boolean(postgresConfig.password),
    isDockerEnv: postgresConfig.isDockerEnvironment,
    // Adicionar valores brutos dos placeholders para diagnóstico
    rawPlaceholders: {
      hostPlaceholder: typeof DB_POSTGRESDB_HOST_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_HOST_PLACEHOLDER : 'não disponível',
      hostPlaceholderType: typeof DB_POSTGRESDB_HOST_PLACEHOLDER,
      userPlaceholder: typeof DB_POSTGRESDB_USER_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_USER_PLACEHOLDER : 'não disponível',
      databasePlaceholder: typeof DB_POSTGRESDB_DATABASE_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_DATABASE_PLACEHOLDER : 'não disponível',
      portPlaceholder: typeof DB_POSTGRESDB_PORT_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_PORT_PLACEHOLDER : 'não disponível'
    },
    // Adicionar informação sobre o hostname original (antes de processamento)
    originalHost: postgresConfig.originalHost || postgresConfig.host,
    // Incluir diagnósticos detalhados
    diagnostics: diagnostics
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
  
  // Verificar se os valores das variáveis de ambiente foram substituídos corretamente
  if (postgresConfig.host.includes("PLACEHOLDER") || 
      postgresConfig.user.includes("PLACEHOLDER")) {
    suggestions.push("As variáveis de ambiente não foram substituídas corretamente. Verifique o processo de build e deploy.");
  }
  
  // Adicionar sugestões específicas baseadas na configuração atual
  if (postgresConfig.host.includes('_')) {
    if (postgresConfig.isDockerEnvironment) {
      suggestions.push("Verifique se os containers estão na mesma rede Docker");
      suggestions.push("Confirme que o nome do serviço PostgreSQL está correto no Docker Compose");
      suggestions.push("Tente usar o nome simples do serviço sem domínio (primeira parte antes do ponto)");
    } else {
      suggestions.push("Substitua o hostname com underscores por seu endereço IP equivalente no arquivo .env");
    }
  }
  
  // Sugestões específicas para Docker
  if (postgresConfig.isDockerEnvironment) {
    suggestions.push("Verifique se o container do banco de dados está em execução (docker ps)");
    suggestions.push("Confirme que não há conflitos de portas no Docker");
    suggestions.push("Tente acessar o banco diretamente do container (docker exec -it [container] psql...)");
  }
  
  // Adicionar sugestões gerais
  suggestions.push("Verifique se o firewall permite conexões para a porta do PostgreSQL");
  suggestions.push("Confirme se as credenciais de acesso ao banco estão corretas");
  suggestions.push("Verifique se o banco de dados está em execução");
  suggestions.push("Tente aumentar o tempo de timeout da conexão");
  
  return suggestions;
};

/**
 * Verifica se o sistema está rodando em ambiente Docker
 */
export const isDockerEnvironment = (): boolean => {
  return postgresConfig.isDockerEnvironment || false;
};

/**
 * Verifica se as variáveis de ambiente foram corretamente substituídas
 */
export const areEnvironmentVariablesReplaced = (): boolean => {
  return !postgresConfig.host.includes("PLACEHOLDER") && 
         !postgresConfig.user.includes("PLACEHOLDER") && 
         !postgresConfig.database.includes("PLACEHOLDER");
};

/**
 * Fornece uma análise detalhada do problema de conexão
 */
export const getDetailedAnalysis = (): string => {
  const diagnostics = getConnectionDiagnostics();
  
  if (!areEnvironmentVariablesReplaced()) {
    return "As variáveis de ambiente não foram substituídas corretamente durante o build/deploy.";
  }
  
  if (postgresConfig.isDockerEnvironment) {
    return "Ambiente Docker/EasyPanel detectado. Problemas comuns incluem configuração incorreta de rede entre containers ou nomes de serviços.";
  }
  
  return "Problema de conexão padrão. Verifique credenciais, firewall e se o servidor está em execução.";
};
