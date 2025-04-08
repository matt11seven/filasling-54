
// Este arquivo fornece um cliente para operações com a API Python backend
// A conexão com o banco de dados é gerenciada pelo backend Python

// Função simples para substituir as notificações toast
const toast = {
  error: (message: string) => console.error('Error:', message),
  success: (message: string) => console.log('Success:', message),
  info: (message: string) => console.log('Info:', message)
};

// Definir o tipo para as variáveis de ambiente injetadas pelo script de inicialização
declare global {
  interface Window {
    ENV?: {
      VITE_API_URL: string;
      ENVIRONMENT: string;
      PROJECT_NAME: string;
      DOMAIN: string;
    };
  }
}

// Função para obter a URL base da API
const getApiBaseUrl = (): string => {
  // Verificar se existe a variável de ambiente definida pelo script monolítico
  if (typeof window !== 'undefined' && window.ENV && window.ENV.VITE_API_URL) {
    console.log('Usando URL da API do ambiente:', window.ENV.VITE_API_URL);
    return window.ENV.VITE_API_URL;
  }
  
  // Fallback para modo monolítico local
  return '/api';
};

// Armazenar a URL base da API
const API_BASE_URL = getApiBaseUrl();

console.log(`🌐 API Base URL: ${API_BASE_URL}`);

// Função para verificar se o token de autenticação está presente no localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Função para adicionar headers comuns a todas as requisições
const getCommonHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Função para executar consultas no banco através da API
export const query = async (text: string, params?: any[]) => {
  console.log('📊 Query chamada com:', { text, params });
  
  try {
    // Determinar o endpoint baseado na consulta SQL
    let endpoint = '/tickets';
    let method = 'GET';
    let body = null;
    
    // Parse da query para determinar o endpoint apropriado
    if (text.toLowerCase().includes('from tickets')) {
      endpoint = '/tickets';
      
      if (text.toLowerCase().includes('insert')) {
        method = 'POST';
        // Adaptação para o novo modelo de tickets
        body = JSON.stringify({
          nome: params?.[0] || '',  // Nome do cliente
          motivo: params?.[1] || '', // Motivo/descrição
          telefone: '',
          setor: '',
          etapa_numero: 1 // Começa na primeira etapa
        });
      }
    } 
    else if (text.toLowerCase().includes('from etapas')) {
      endpoint = '/etapas';
    }
    else if (text.toLowerCase().includes('from usuarios') || text.toLowerCase().includes('atendentes')) {
      endpoint = '/atendentes';
      
      if (text.toLowerCase().includes('insert')) {
        method = 'POST';
        body = JSON.stringify({
          email: params?.[0] || '',  // E-mail como usuário
          nome: params?.[1] || '',  // Nome do atendente
          senha: params?.[2] || '',
          ativo: true
        });
      }
    }
    else if (text.toLowerCase().includes('login') || text.toLowerCase().includes('where usuario =')) {
      // Consultas de login devem usar o endpoint auth/login
      console.log('🔒 Consulta de login detectada - redirecionando para auth');
      endpoint = '/auth/login';
    }
    
    console.log(`🌐 Fazendo requisição para ${API_BASE_URL}${endpoint} (${method})`);
    
    // Fazer a chamada para a API
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: getCommonHeaders(),
      body: method !== 'GET' && body ? body : undefined,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🚨 API respondeu com status: ${response.status}, erro: ${errorText}`);
      throw new Error(`API respondeu com status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Dados recebidos da API:', data);
    
    // Formatar resposta para compatibilidade com o código existente
    if (Array.isArray(data)) {
      return { rows: data, rowCount: data.length };
    } 
    // Verificações mantidas para compatiblidade retroativa com diferentes formatos de resposta
    else if (data.tickets && Array.isArray(data.tickets)) {
      return { rows: data.tickets, rowCount: data.tickets.length };
    } 
    else if (data.atendentes && Array.isArray(data.atendentes)) {
      return { rows: data.atendentes, rowCount: data.atendentes.length };
    }
    else if (data.etapas && Array.isArray(data.etapas)) {
      return { rows: data.etapas, rowCount: data.etapas.length };
    }
    
    return { rows: [data], rowCount: 1 };
  } catch (error) {
    console.error('❌ Erro ao executar query na API:', error);
    toast.error(`Erro na execução da query: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    return { rows: [], rowCount: 0 };
  }
};

// Implementação de transações através da API
export const transaction = async (callback: (client: any) => Promise<any>) => {
  console.log('🔄 Transação API iniciada');
  
  try {
    // Criar um cliente de transação mock para compatibilidade com código existente
    const apiClient = {
      query: query
    };
    
    return await callback(apiClient);
  } catch (error) {
    console.error('❌ Erro na transação API:', error);
    toast.error(`Erro na transação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    throw error;
  }
};

// Teste de conexão com a API
export const testConnection = async (): Promise<boolean> => {
  console.log('🔌 Testando conexão com a API');
  
  try {
    // Testar a conexão chamando o endpoint de health check
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: getCommonHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Verificação de saúde da API falhou: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ API health check:', data);
    return true;
  } catch (error) {
    console.error('❌ Teste de conexão com a API falhou:', error);
    return false;
  }
};

// Função para resetar o pool (mantida para compatibilidade)
export const resetPool = () => {
  console.log('🔄 Reset do cliente API');
  return Promise.resolve();
};

// Função auxiliar para login através da API
export const loginViaApi = async (username: string, password: string) => {
  console.log(`🔑 Tentando login para: ${username}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Login falhou (${response.status}): ${errorText}`);
    }
    
    const userData = await response.json();
    console.log('✅ Login bem-sucedido:', {
      id: userData.id,
      usuario: userData.usuario,
      isAdmin: userData.isAdmin 
    });
    
    // Armazenar o token se estiver presente
    if (userData.access_token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', userData.access_token);
    }
    
    return userData;
  } catch (error) {
    console.error('❌ Erro de login:', error);
    throw error;
  }
};
