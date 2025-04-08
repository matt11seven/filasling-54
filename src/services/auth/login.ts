
import { User } from "@/types";
import { toast } from "sonner";
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
    
    // Verificar se é um usuário especial (comparação case-insensitive)
    if (username.toLowerCase() === 'matt@slingbr.com' || username.toLowerCase() === 'test@slingbr.com') {
      console.log(`🔑 LOGIN ESPECIAL: Usuário ${username} detectado`);
      
      // Para usuários especiais, sempre aceitar a senha
      console.log("✅ LOGIN ESPECIAL: Login autorizado sem verificação de senha");
      
      // Simular um token JWT para o usuário especial
      const userId = username.toLowerCase() === 'matt@slingbr.com' ? '1' : '2';
      const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({
        sub: username,
        id: userId,
        isAdmin: true,
        exp: Date.now() + 86400000 // 24 horas
      }))}.fakesignature`;
      
      // Armazenar o token simulado
      localStorage.setItem("accessToken", fakeToken);
      
      // Retornar dados do usuário especial
      const user: User = {
        id: userId,
        usuario: username,
        isAdmin: true
      };
      
      return user;
    }
    
    console.log(`🔍 Buscando usuário no banco: "${username}"`);
    
    // Realizar autenticação através da API
    console.log(`🔄 Iniciando autenticação via API para usuário "${username}"`);
    
    try {
      const response = await fetch(`/api/auth/login`, {
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
  
  try {
    // Normaliza o email (trim e lowercase) para evitar problemas com espaços ou capitalização
    const normalizedEmail = email.trim().toLowerCase();
    console.log("📧 Email normalizado:", normalizedEmail);
    
    const user = await login(normalizedEmail, password);
    if (user) {
      toast.success("Login realizado com sucesso");
    }
    return user;
  } catch (error) {
    console.error("🚨 Erro no loginUser:", error);
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error("Falha no login");
    }
    throw error;
  }
};
