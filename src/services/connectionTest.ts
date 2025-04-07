
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
    const config = {
      host: DB_HOST_PLACEHOLDER,
      port: DB_PORT_PLACEHOLDER,
      user: DB_USER_PLACEHOLDER, 
      password: DB_PASSWORD_PLACEHOLDER,
      database: DB_NAME_PLACEHOLDER
    };
    
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
    }
    
    return config;
  } catch (error) {
    console.error('[DB Config] Erro ao obter configurações do banco de dados:', error);
    return null;
  }
};

export const checkDatabaseConnection = async (): Promise<ConnectionStatus> => {
  // Em um ambiente de navegador, não podemos testar diretamente a conexão do banco de dados
  console.log('[DB Diagnóstico] Verificação de conexão solicitada');
  
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
  
  // No ambiente de navegador, apenas reporta que as variáveis parecem configuradas
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
        // Não mostra a senha nos logs por segurança
        password: '********',
      },
      timestamp: new Date().toISOString()
    }
  };
};

export const resetDatabaseConnection = async (): Promise<ConnectionStatus> => {
  console.log('[DB Diagnóstico] Reinicialização de conexão solicitada');
  
  return {
    connected: true,
    message: "Conexão simulada reiniciada.",
    diagnostics: {
      env: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      action: "connection_reset"
    }
  };
};
