
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { checkUserActive } from "@/services/auth";
import { useAuth } from "@/contexts/AuthContext";
import { InfoIcon, Loader } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { checkDatabaseConnection } from "@/services/connectionTest";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

type FormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchMode: () => void;
  onLoginSuccess?: () => void;
}

const LoginForm = ({ onSwitchMode }: LoginFormProps) => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showApprovalInfo, setShowApprovalInfo] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{connected: boolean, message?: string, diagnostics?: any}>({
    connected: true
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setShowApprovalInfo(false);

      // Normalizando o email para remover espaços e padronizar lowercase
      const normalizedEmail = values.email.trim().toLowerCase();
      
      // Log para debug
      console.log(`🔐 TENTATIVA DE LOGIN FORM - Email: "${normalizedEmail}" (original: "${values.email}")`);
      console.log(`🔐 TENTATIVA DE LOGIN FORM - Senha: ${values.password ? "******** (preenchida)" : "(vazia)"}`);
      
      // Verifica conexão com o banco (apenas log, não exibe para o usuário)
      const status = await checkDatabaseConnection();
      console.log('Status da conexão antes do login:', status);
      
      if (!status.connected) {
        console.error("❌ FALHA LOGIN: Banco de dados não conectado");
        setErrorMessage("Não foi possível conectar ao banco de dados. Por favor, tente novamente mais tarde.");
        return;
      }
      
      // Verificação especial para o usuário master
      const isMasterUser = normalizedEmail === 'matt@slingbr.com';
      console.log("É usuário master?", isMasterUser ? "SIM" : "NÃO");
      
      try {
        console.log("🔐 Iniciando processo de login com credenciais fornecidas...");
        // Tenta fazer login diretamente
        await login(normalizedEmail, values.password);
        console.log("✅ LOGIN FORM: Login bem-sucedido!");
      } catch (error) {
        console.error("❌ FALHA LOGIN FORM: Erro durante o login:", error);
        
        // Verifica se o usuário existe e está ativo 
        // (apenas para usuários não-master que tiveram erro no login)
        if (!isMasterUser) {
          try {
            console.log(`🔍 Verificando status do usuário: ${normalizedEmail}`);
            const { isActive, exists } = await checkUserActive(normalizedEmail);
            console.log(`📊 Verificação do usuário ${normalizedEmail}:`, { isActive, exists });
            
            // Se o usuário não existe
            if (!exists) {
              console.error(`❌ FALHA LOGIN FORM: Usuário ${normalizedEmail} não existe`);
              setErrorMessage("Este usuário não está registrado. Por favor, crie uma conta primeiro.");
              return;
            }
            
            // Se o usuário existe mas não está ativo
            if (!isActive) {
              console.log(`⏳ LOGIN FORM: Usuário ${normalizedEmail} existe mas não está ativo`);
              setErrorMessage("Sua conta está aguardando aprovação do administrador.");
              setShowApprovalInfo(true);
              return;
            }
            
            // Se chegou aqui, o erro foi provavelmente na senha
            console.error(`❌ FALHA LOGIN FORM: Senha incorreta para usuário ${normalizedEmail}`);
            setErrorMessage("Credenciais inválidas. Verifique seu email e senha.");
          } catch (checkError) {
            console.error("❌ FALHA LOGIN FORM: Erro ao verificar status do usuário:", checkError);
            setErrorMessage("Erro ao verificar credenciais. Tente novamente mais tarde.");
          }
        } else {
          // Erro específico para o usuário master
          console.error(`❌ FALHA LOGIN FORM: Credenciais inválidas para usuário master`);
          setErrorMessage("Credenciais inválidas para o usuário master.");
        }
      }
    } catch (error) {
      console.error("❌ FALHA LOGIN FORM: Erro geral:", error);
      setErrorMessage("Ocorreu um erro no processo de autenticação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!connectionStatus.connected && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <InfoIcon className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-700">Problema de conexão</AlertTitle>
          <AlertDescription className="text-yellow-600">
            {connectionStatus.message}
            {connectionStatus.diagnostics && (
              <div className="mt-2 text-xs">
                <p>Diagnóstico:</p>
                <pre className="bg-yellow-100 p-1 rounded">
                  {JSON.stringify(connectionStatus.diagnostics, null, 2)}
                </pre>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {showApprovalInfo && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <InfoIcon className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700">Aguardando aprovação</AlertTitle>
          <AlertDescription className="text-green-600">
            Sua conta foi criada e está aguardando aprovação do administrador. Você receberá uma notificação quando sua conta for aprovada.
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <InfoIcon className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-700">Erro</AlertTitle>
          <AlertDescription className="text-red-600">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="seu.email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="******" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" /> Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </Form>
      
      <div className="mt-4 text-center">
        <Button 
          variant="link" 
          onClick={onSwitchMode} 
          className="p-0"
        >
          Não tem uma conta? Cadastre-se
        </Button>
      </div>
    </>
  );
};

export default LoginForm;
