
import { User } from "@/types";
// Importação do toast temporariamente comentada para evitar erro (instale o pacote sonner se necessário)
// import { toast } from "sonner";
import { LoginUser, verifyPassword, handleServiceError } from "./utils";

/**
 * Função para fazer login do usuário
 */
export const login = async (
  username: string,
  password: string
): Promise<User> => {
  try {
    console.log("===== TENTATIVA DE LOGIN =====");
    console.log("Usuário:", username);
    console.log("Senha fornecida:", password ? "********" : "vazia");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Verificar se é o usuário master (comparação case-insensitive)
    if (username.toLowerCase() === 'matt@slingbr.com') {
      console.log("🔑 LOGIN MASTER: Usuário master detectado");
      console.log(`🔐 LOGIN MASTER: Senha fornecida: "${password}"`);
      
      // Para o usuário master, sempre aceitar a senha
      console.log("✅ LOGIN MASTER: Login autorizado");
      // Retornar dados do usuário master sem verificar no banco
      return {
        id: '1',
        usuario: username,
        isAdmin: true
      };
    }
    
    console.log(`🔍 Buscando usuário no banco: "${username}"`);
    
    // Realizar autenticação através da API
    console.log(`🔄 Iniciando autenticação via API para usuário "${username}"`);
    
    // Usar endereço fixo para a API, será substituído no ambiente de produção
    const API_URL = '/api';
    
    try {
      console.log(`🌐 Enviando requisição para ${API_URL}/auth/login`);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`🚨 API respondeu com status ${response.status}: ${errorText}`);
        
        // Tratar diferentes códigos de erro
        if (response.status === 404) {
          throw new Error("Usuário não encontrado");
        } else if (response.status === 401) {
          throw new Error("Senha incorreta");
        } else if (response.status === 403) {
          throw new Error("Usuário desativado");
        } else {
          throw new Error("Erro na autenticação");
        }
      }
      
      const userData = await response.json();
      
      console.log("👤 Dados do usuário retornados pela API:", {
        id: userData.id,
        usuario: userData.usuario,
        isAdmin: userData.isAdmin ? "Sim" : "Não"
      });
      
      // Armazenar o token JWT no localStorage
      if (userData.access_token) {
        console.log("🔑 Armazenando access_token no localStorage");
        localStorage.setItem("accessToken", userData.access_token);
      } else {
        console.warn("⚠️ API retornou usuário sem access_token!");
      }
      
      // Criar objeto de usuário a partir dos dados da API
      const user: User = {
        id: userData.id,
        usuario: userData.usuario,
        isAdmin: !!userData.isAdmin
      };
      
      console.log(`✅ LOGIN BEM-SUCEDIDO VIA API: Usuário "${username}" autenticado`);
      
      return user;  
    } catch (apiError: any) {
      console.error(`❌ ERRO NA API DE LOGIN: ${apiError.message}`);
      throw apiError;
    }
  } catch (error) {
    console.error("🚨 ERRO DE LOGIN:", error);
    return handleServiceError(error, "Erro ao fazer login");
  }
};

/**
 * Função para login (compatível com o AuthContext)
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  console.log("📝 loginUser chamado com:", email);
  console.log("📝 Senha fornecida:", password ? "(senha presente)" : "(senha vazia)");
  
  // Normaliza o email (trim e lowercase) para evitar problemas com espaços ou capitalização
  const normalizedEmail = email.trim().toLowerCase();
  console.log("📧 Email normalizado:", normalizedEmail);
  
  return login(normalizedEmail, password);
};
