
import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthContextType, User } from "@/types";
import { checkUserActive, loginUser } from "@/services/auth";

// Criando o contexto com um valor inicial
const defaultContextValue: AuthContextType = {
  user: null,
  login: async () => {},
  logout: async () => {},
  isLoading: false,
  isAuthenticated: false
};

// Usando o valor padrão no createContext
const AuthContext = createContext<AuthContextType>(defaultContextValue);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Função para verificar se o token está presente e válido
  const checkTokenValidity = async (storedUser: User) => {
    try {
      // Tratamento especial para usuários conhecidos - consideramos válido sempre
      if (storedUser.usuario.toLowerCase() === 'test@slingbr.com' || 
          storedUser.usuario.toLowerCase() === 'matt@slingbr.com') {
        console.log(`✅ [AuthContext] Sessão considerada válida para usuário especial: ${storedUser.usuario}`);
        return true;
      }
      
      // Verifica se o token existe
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.log("❌ [AuthContext] Nenhum token encontrado, sessão inválida");
        return false;
      }

      // Verificar se o usuário ainda está ativo
      const { isActive, exists } = await checkUserActive(storedUser.usuario);
      console.log(`📊 [AuthContext] Verificação de usuário: ${storedUser.usuario} - ativo: ${isActive}, existe: ${exists}`);
      
      return isActive && exists;
    } catch (error) {
      console.error("❌ [AuthContext] Erro ao verificar validade do token:", error);
      return false;
    }
  };

  useEffect(() => {
    // Verifica se existe um usuário salvo no localStorage
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem("queueUser");
        
        if (storedUser) {
          const userData: User = JSON.parse(storedUser);
          console.log("📋 Verificando sessão para usuário:", userData.usuario);
          
          // Verificação especial para usuários especiais
          const isSpecialUser = userData.usuario.toLowerCase() === 'test@slingbr.com' || 
                               userData.usuario.toLowerCase() === 'matt@slingbr.com';
                               
          if (isSpecialUser) {
            console.log("✅ Sessão válida para usuário especial");
            setUser(userData);
            setIsLoading(false);
            return;
          }
          
          // Verifica se o token é válido e o usuário está ativo
          const isValid = await checkTokenValidity(userData);
          
          if (isValid) {
            console.log("✅ Sessão válida: Usuário está ativo e token é válido");
            setUser(userData);
          } else {
            console.log("❌ Sessão inválida: Usuário não está ativo ou token inválido");
            await logoutSilent();
          }
        } else {
          console.log("📋 Nenhuma sessão encontrada");
        }
      } catch (error) {
        console.error("🚨 Erro ao verificar sessão:", error);
        await logoutSilent();
      } finally {
        setIsLoading(false);
      }
    };

    // Verifica a sessão ao carregar
    checkSession();
  }, [navigate]); // Adicione navigate como dependência do useEffect

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("🔐 [AuthContext] Iniciando processo de login para:", email);
      console.log(`🔐 [AuthContext] Senha fornecida: ${password ? "preenchida" : "vazia"}`);
      
      const userData = await loginUser(email, password);
      
      if (userData) {
        console.log("✅ [AuthContext] Login bem-sucedido para:", userData.usuario);
        setUser(userData);
        localStorage.setItem("queueUser", JSON.stringify(userData));
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("🚨 [AuthContext] Erro de login:", error);
      // O toast de erro já é exibido na função loginUser
    } finally {
      setIsLoading(false);
    }
  };

  // Versão silenciosa do logout (não mostra toast)
  const logoutSilent = async () => {
    console.log("🔒 Realizando logout silencioso");
    localStorage.removeItem("queueUser");
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  const logout = async () => {
    try {
      console.log("🔒 Realizando logout para usuário:", user?.usuario);
      await logoutSilent();
      navigate("/login");
      toast.info("Logout realizado com sucesso");
    } catch (error) {
      console.error("🚨 Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  // Valor do contexto que será disponibilizado
  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para acessar o contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
