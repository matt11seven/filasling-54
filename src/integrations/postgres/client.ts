
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
  // Verificar se estamos em ambiente EasyPanel ou produção
  const isProduction = typeof window !== 'undefined' && 
    window.location && 
    window.location.hostname.includes('easypanel.host');

  console.log(`🌐 Ambiente detectado: ${isProduction ? 'PRODUÇÃO' : 'DEV/LOCAL'}`);
  
  // Em produção, sempre usar caminho relativo e HTTPS
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:8001/api';
  } else {
    return '/api';
  }
  
  // Se tiver variável de ambiente definida pelo script monolítico, usar ela
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

// Função para obter o token de autenticação do localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    // Usar o accessToken que é definido no login
    return localStorage.getItem('accessToken');
  }
  return null;
};

// Função para adicionar headers comuns a todas as requisições
const getCommonHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  console.log('🔑 Verificando token de autenticação:', token ? 'Token encontrado' : 'Token ausente');
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Header de autorização adicionado:', `Bearer ${token.substring(0, 15)}...`);
  } else {
    console.log('⚠️ Atenção: Token não encontrado no localStorage');
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
    
    // Construir a URL da API garantindo que seja HTTPS em ambiente de produção
    let apiUrl = `${API_BASE_URL}${endpoint}`;
    
    // Forçar HTTPS para todas as requisições em ambiente de produção
    if (typeof window !== 'undefined' && 
        window.location && 
        window.location.protocol === 'https:' && 
        apiUrl.startsWith('http:')) {
      apiUrl = apiUrl.replace('http:', 'https:');
      console.log('🔐 Conversão forçada de HTTP para HTTPS:', apiUrl);
    }
    
    // Se a URL não começar com http/https e estivermos em HTTPS, adicionar https://hostname
    if (typeof window !== 'undefined' && 
        window.location && 
        window.location.protocol === 'https:' && 
        apiUrl.startsWith('/')) {
      apiUrl = `https://${window.location.hostname}${apiUrl}`;
      console.log('🔐 URL relativa convertida para absoluta HTTPS:', apiUrl);
    }
    
    console.log(`🌐 Fazendo requisição para ${apiUrl} (${method})`);
    
    // Fazer a chamada para a API com os headers de autenticação
    const response = await fetch(apiUrl, {
      method,
      headers: getCommonHeaders(),
      body: method !== 'GET' && body ? body : undefined
    });
    
    // Log para debug do token
    const token = getAuthToken();
    console.log('🔑 Token usado na requisição:', token ? 'presente' : 'ausente');
    
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
  console.log(`🌐 API Base URL: ${API_BASE_URL}`);
  
  // Garantir que não estamos usando localhost absoluto
  const fullUrl = `${API_BASE_URL}/auth/login`;
  console.log(`📍 URL completa: ${fullUrl}`);
  console.log(`🔍 Hostname atual: ${window.location.hostname}`);
  
  try {
    console.log('💾 Iniciando fetch para login...');
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Login falhou (${response.status}):`, errorText);
      
      // Limpar token existente em caso de erro
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
      
      // Tentar extrair mensagem de erro do JSON se possível
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || `Login falhou (${response.status})`);
      } catch {
        throw new Error(`Login falhou (${response.status}): ${errorText}`);
      }
    }
    
    const userData = await response.json();
    console.log('✅ Login bem-sucedido:', {
      id: userData.id,
      usuario: userData.usuario,
      isAdmin: userData.isAdmin 
    });
    
    // Armazenar o token se estiver presente
    if (userData.access_token && typeof window !== 'undefined') {
      localStorage.setItem('accessToken', userData.access_token);
      console.log('🔑 Token de autenticação armazenado:', userData.access_token.substring(0, 15) + '...');
    }
    
    return userData;
  } catch (error) {
    console.error('❌ Erro de login:', error);
    // Log para ajudar no diagnóstico
    console.error('🔍 Detalhes do erro:', {
      mensagem: error.message,
      nome: error.name,
      stack: error.stack,
      causa: error.cause
    });
    throw error;
  }
};
