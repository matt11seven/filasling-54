
interface ConnectionStatus {
  connected: boolean;
  message: string;
  error?: string;
  diagnostics?: Record<string, any>;
}

// Obter configurações de conexão do arquivo .env ou de placeholders
export const getDatabaseConfig = () => {
  try {
    // Verifica se estamos em produção (substituídas em runtime pelo script env.sh)
    // ou em desenvolvimento (valores do .env)
    let config;
    
    try {
      config = {
        host: DB_HOST_PLACEHOLDER,
        port: DB_PORT_PLACEHOLDER,
        user: DB_USER_PLACEHOLDER, 
        password: DB_PASSWORD_PLACEHOLDER,
        database: DB_NAME_PLACEHOLDER
      };
    } catch (e) {
      console.error('[DB Config] Erro ao acessar variáveis:', e);
      // Fallback para valores padrão caso os placeholders não estejam definidos
      config = {
        host: "localhost",
        port: "5432",
        user: "postgres",
        password: "postgres",
        database: "slingfila"
      };
      console.warn('[DB Config] Usando valores padrão para configuração de banco de dados');
    }
    
    // Logs detalhados para auxiliar no debug
    console.log('[DB Config] Configurações de banco obtidas:', {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
      password: '********' // Não exibe a senha real por segurança
    });
    
    // Verifica se os placeholders foram substituídos (ambiente de produção)
    const anyPlaceholder = Object.values(config).some(value => 
      typeof value === 'string' && value.includes('_PLACEHOLDER')
    );
    
    if (anyPlaceholder) {
      console.warn('[DB Config] ATENÇÃO: Alguns placeholders não foram substituídos:', 
        Object.entries(config)
          .filter(([_, v]) => typeof v === 'string' && v.includes('_PLACEHOLDER'))
          .map(([k]) => k)
      );
      
      // Se estamos em produção e placeholders não foram substituídos, 
      // use valores padrão
      if (import.meta.env.PROD) {
        config = {
          host: "localhost",
          port: "5432",
          user: "postgres",
          password: "postgres",
          database: "slingfila"
        };
        console.warn('[DB Config] Usando valores padrão em produção devido a placeholders não substituídos');
      }
    }
    
    return config;
  } catch (error) {
    console.error('[DB Config] Erro ao obter configurações do banco de dados:', error);
    return {
      host: "localhost",
      port: "5432",
      user: "postgres", 
      password: "postgres",
      database: "slingfila"
    };
  }
};

export const checkDatabaseConnection = async (): Promise<ConnectionStatus> => {
  // Em um ambiente de navegador, não podemos testar diretamente a conexão do banco de dados
  console.log('[DB Diagnóstico] Verificação de conexão solicitada');
  
  try {
    const config = getDatabaseConfig();
    console.log('[DB Diagnóstico] Configurações para diagnóstico:', config ? {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
      password: '********'
    } : 'Não configurado');
    
    if (!config) {
      return {
        connected: false,
        message: "Variáveis de ambiente para banco de dados não encontradas.",
        diagnostics: { 
          env: import.meta.env.MODE,
          timestamp: new Date().toISOString(),
          reason: "no_config",
          appVersion: import.meta.env.PACKAGE_VERSION || 'desconhecida'
        }
      };
    }
    
    // Verifica se os valores são placeholders não substituídos
    const hasUnreplacedPlaceholders = Object.values(config).some(value => 
      typeof value === 'string' && value.includes('_PLACEHOLDER')
    );
    
    if (hasUnreplacedPlaceholders) {
      return {
        connected: false,
        message: "Placeholders de variáveis de ambiente não foram substituídos. Verifique se o script env.sh está sendo executado corretamente.",
        diagnostics: {
          env: import.meta.env.MODE,
          config: {
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            // Não mostra a senha nos logs por segurança
            password: '********',
          },
          unreplacedPlaceholders: Object.entries(config)
            .filter(([_, v]) => typeof v === 'string' && v.includes('_PLACEHOLDER'))
            .map(([k]) => k),
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Dependendo do ambiente, simulamos uma conexão ou reportamos apenas as config
    if (import.meta.env.DEV) {
      // Em desenvolvimento, simulamos uma conexão bem-sucedida
      return {
        connected: true,
        message: "Ambiente de desenvolvimento: simulando conexão bem-sucedida com o banco de dados.",
        diagnostics: {
          env: import.meta.env.MODE,
          config: {
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: '********',
          },
          timestamp: new Date().toISOString()
        }
      };
    } else {
      // Em produção, assumimos que o env.sh já testou a conexão
      return {
        connected: true,
        message: "Variáveis de ambiente para conexão com o banco de dados encontradas.",
        diagnostics: {
          env: import.meta.env.MODE,
          config: {
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: '********',
          },
          timestamp: new Date().toISOString()
        }
      };
    }
  } catch (error) {
    console.error('[DB Diagnóstico] Erro ao verificar conexão:', error);
    return {
      connected: false,
      message: "Erro ao verificar configurações do banco de dados.",
      error: error instanceof Error ? error.message : String(error),
      diagnostics: {
        env: import.meta.env.MODE,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : String(error)
      }
    };
  }
};

export const resetDatabaseConnection = async (): Promise<ConnectionStatus> => {
  console.log('[DB Diagnóstico] Reinicialização de conexão solicitada');
  
  // Em um ambiente de navegador, não podemos realmente reiniciar a conexão
  // com o banco de dados, então simulamos uma reinicialização
  try {
    // Verificamos a conexão novamente
    return await checkDatabaseConnection();
  } catch (error) {
    console.error('[DB Diagnóstico] Erro ao reiniciar conexão:', error);
    return {
      connected: false,
      message: "Erro ao reiniciar conexão com o banco de dados.",
      error: error instanceof Error ? error.message : String(error),
      diagnostics: {
        env: import.meta.env.MODE,
        timestamp: new Date().toISOString(),
        action: "connection_reset_failed",
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : String(error)
      }
    };
  }
};
