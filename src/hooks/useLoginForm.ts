
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { checkUserActive } from "@/services/auth";
import { checkDatabaseConnection } from "@/services/connectionTest";

// Define the validation schema
const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const useLoginForm = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showApprovalInfo, setShowApprovalInfo] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{connected: boolean, message?: string, diagnostics?: any}>({
    connected: true
  });

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      console.log(`🔑 [LoginForm] Submit - Iniciando tentativa de login para: "${values.email}"`);
      console.log(`🔑 [LoginForm] Submit - Senha fornecida: ${values.password ? "******** (preenchida)" : "(vazia)"}`);
      
      setIsLoading(true);
      setErrorMessage(null);
      setShowApprovalInfo(false);

      // Normalizando o email para remover espaços e padronizar lowercase
      const normalizedEmail = values.email.trim().toLowerCase();
      
      // Log para debug
      console.log(`🔐 [LoginForm] TENTATIVA DE LOGIN - Email normalizado: "${normalizedEmail}"`);
      
      // Verifica conexão com o banco (apenas log, não exibe para o usuário)
      const status = await checkDatabaseConnection();
      console.log('[LoginForm] Status da conexão antes do login:', status);
      
      if (!status.connected) {
        console.error("❌ [LoginForm] FALHA LOGIN: Banco de dados não conectado");
        setErrorMessage("Não foi possível conectar ao banco de dados. Por favor, tente novamente mais tarde.");
        return;
      }
      
      // Verificação especial para o usuário master
      const isMasterUser = normalizedEmail === 'matt@slingbr.com';
      console.log("[LoginForm] É usuário master?", isMasterUser ? "SIM" : "NÃO");
      
      try {
        console.log("🔐 [LoginForm] Iniciando processo de login no AuthContext...");
        // Tenta fazer login diretamente
        await login(normalizedEmail, values.password);
        console.log("✅ [LoginForm] Login bem-sucedido!");
      } catch (error) {
        console.error("❌ [LoginForm] FALHA LOGIN: Erro durante o login:", error);
        
        // Verifica se o usuário existe e está ativo 
        // (apenas para usuários não-master que tiveram erro no login)
        if (!isMasterUser) {
          try {
            console.log(`🔍 [LoginForm] Verificando status do usuário: ${normalizedEmail}`);
            const { isActive, exists } = await checkUserActive(normalizedEmail);
            console.log(`📊 [LoginForm] Verificação do usuário ${normalizedEmail}:`, { isActive, exists });
            
            // Se o usuário não existe
            if (!exists) {
              console.error(`❌ [LoginForm] FALHA LOGIN: Usuário ${normalizedEmail} não existe`);
              setErrorMessage("Este usuário não está registrado. Por favor, crie uma conta primeiro.");
              return;
            }
            
            // Se o usuário existe mas não está ativo
            if (!isActive) {
              console.log(`⏳ [LoginForm] Usuário ${normalizedEmail} existe mas não está ativo`);
              setErrorMessage("Sua conta está aguardando aprovação do administrador.");
              setShowApprovalInfo(true);
              return;
            }
            
            // Se chegou aqui, o erro foi provavelmente na senha
            console.error(`❌ [LoginForm] FALHA LOGIN: Senha incorreta para usuário ${normalizedEmail}`);
            setErrorMessage("Credenciais inválidas. Verifique seu email e senha.");
          } catch (checkError) {
            console.error("❌ [LoginForm] FALHA LOGIN: Erro ao verificar status do usuário:", checkError);
            setErrorMessage("Erro ao verificar credenciais. Tente novamente mais tarde.");
          }
        } else {
          // Erro específico para o usuário master
          console.error(`❌ [LoginForm] FALHA LOGIN: Credenciais inválidas para usuário master`);
          setErrorMessage("Credenciais inválidas para o usuário master.");
        }
      }
    } catch (error) {
      console.error("❌ [LoginForm] FALHA LOGIN: Erro geral:", error);
      setErrorMessage("Ocorreu um erro no processo de autenticação");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    showApprovalInfo,
    errorMessage,
    connectionStatus,
    onSubmit: form.handleSubmit(onSubmit),
  };
};
