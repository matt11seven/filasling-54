
import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthContextType, User } from "@/types";
import { checkUserActive, loginUser } from "@/services/auth";

// Criando o contexto com um valor inicial undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se existe um usuário salvo no localStorage
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem("queueUser");
        
        if (storedUser) {
          const userData: User = JSON.parse(storedUser);
          
          // Verifica se o usuário ainda está ativo
          const { isActive } = await checkUserActive(userData.usuario);
          
          if (isActive) {
            setUser(userData);
          } else {
            await logout();
            toast.error("Sua conta está aguardando aprovação do administrador");
            navigate("/login");
          }
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        setUser(null);
        localStorage.removeItem("queueUser");
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
      
      const userData = await loginUser(email, password);
      
      if (userData) {
        setUser(userData);
        localStorage.setItem("queueUser", JSON.stringify(userData));
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Erro de login:", error);
      toast.error("Erro de autenticação");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("queueUser");
      setUser(null);
      navigate("/login");
      toast.info("Logout realizado com sucesso");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
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
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
