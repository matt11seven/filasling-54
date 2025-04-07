
// This file provides a mock/proxy interface for database operations in the browser
// Real connections will be handled by the server (via env.sh)

import { toast } from 'sonner';

// Get database configuration (from placeholders or env)
const getDbConfig = () => {
  try {
    // Check for placeholders replaced by env.sh script
    let config;
    
    try {
      config = {
        host: DB_HOST_PLACEHOLDER,
        port: DB_PORT_PLACEHOLDER,
        user: DB_USER_PLACEHOLDER, 
        password: DB_PASSWORD_PLACEHOLDER,
        database: DB_NAME_PLACEHOLDER
      };
      
      console.log('🔌 Database config read from placeholders:', {
        ...config,
        password: '********' // Don't log the actual password
      });
    } catch (e) {
      console.error('❌ Error accessing database placeholders:', e);
      // Fallback to default values
      config = {
        host: "localhost",
        port: "5432",
        user: "postgres",
        password: "postgres", 
        database: "slingfila"
      };
      console.warn('⚠️ Using fallback database configuration');
    }
    
    // Check if placeholders were properly replaced
    const hasPlaceholders = Object.values(config).some(
      value => typeof value === 'string' && value.includes('_PLACEHOLDER')
    );
    
    if (hasPlaceholders) {
      console.error('❌ Database placeholders were not replaced:', 
        Object.entries(config)
          .filter(([_, v]) => typeof v === 'string' && v.includes('_PLACEHOLDER'))
          .map(([k]) => k)
      );
      
      // If we're in production but placeholders weren't replaced, log an error
      if (import.meta.env.PROD) {
        toast.error('Erro na configuração do banco de dados. Verifique os logs.');
        console.error('❌ ERRO CRÍTICO: Os placeholders do banco de dados não foram substituídos pelo script env.sh');
      }
    }
    
    return config;
  } catch (error) {
    console.error('❌ Error getting database configuration:', error);
    return null;
  }
};

// Execute this immediately to validate configuration on load
const dbConfig = getDbConfig();
console.log('🏁 Initial database configuration loaded:', dbConfig ? 'OK' : 'FAILED');

// Mock query function for client-side
export const query = async (text: string, params?: any[]) => {
  console.log('📊 Query called with:', { text, params });
  
  // In development mode, you can return mock data for testing
  if (import.meta.env.DEV) {
    console.log('🧪 Running in development mode, using mock data');
    
    // For testing purposes, here you can return mock data based on the query
    if (text.includes('FROM tickets')) {
      return { 
        rows: [
          { 
            id: '123', 
            nome: 'Teste Dev', 
            etapa_numero: 1,
            motivo: 'Teste de desenvolvimento',
            data_criado: new Date().toISOString(),
          }
        ],
        rowCount: 1
      };
    }
    
    // Default mock response
    return { rows: [], rowCount: 0 };
  }
  
  // For production, these calls should go through a secure API
  console.warn('⚠️ Direct database queries in the browser. Use API endpoints in production.');
  
  if (!dbConfig || Object.values(dbConfig).some(val => typeof val === 'string' && val.includes('_PLACEHOLDER'))) {
    console.error('❌ Database configuration is invalid or contains placeholders');
    toast.error('Erro na configuração do banco de dados');
    return { rows: [], rowCount: 0 };
  }
  
  // Return empty rows to avoid errors
  return { rows: [], rowCount: 0 };
};

// Mock transaction function
export const transaction = async (callback: (client: any) => Promise<any>) => {
  console.log('🔄 Transaction called');
  
  try {
    const mockClient = {
      query: (text: string, params?: any[]) => {
        console.log('📝 Client query in transaction:', { text, params });
        return Promise.resolve({ rows: [] });
      }
    };
    
    return await callback(mockClient);
  } catch (error) {
    console.error('❌ Transaction error:', error);
    toast.error('Erro na transação do banco de dados');
    throw error;
  }
};

// Mock connection test
export const testConnection = async (): Promise<boolean> => {
  console.log('🔌 Testing database connection');
  
  // Check if database configuration is valid
  if (!dbConfig || Object.values(dbConfig).some(val => typeof val === 'string' && val.includes('_PLACEHOLDER'))) {
    console.error('❌ Cannot test connection: Database configuration contains placeholders or is invalid');
    return false;
  }
  
  // In development, always return true
  if (import.meta.env.DEV) {
    console.log('🧪 DEV mode - Simulating successful connection');
    return true;
  }
  
  // In production, we still can't really test from the browser
  // but we can check if the configuration seems valid
  console.log('🔍 PROD mode - Checking configuration validity');
  const hasValidConfig = dbConfig 
    && typeof dbConfig.host === 'string' 
    && dbConfig.host !== '' 
    && !dbConfig.host.includes('_PLACEHOLDER');
  
  return hasValidConfig;
};

// Mock pool reset
export const resetPool = () => {
  console.log('🔄 Mock pool reset called');
  toast.info('Reiniciando conexão com o banco de dados');
  return {};
};
