
import { useState } from "react";
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
import { checkDatabaseConnection, resetDatabaseConnection } from "@/services/connectionTest";

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
  const [checkingConnection, setCheckingConnection] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const checkConnection = async () => {
    setCheckingConnection(true);
    try {
      const status = await checkDatabaseConnection();
      setConnectionStatus(status);
    } finally {
      setCheckingConnection(false);
    }
  };

  const resetConnection = async () => {
    setCheckingConnection(true);
    try {
      const status = await resetDatabaseConnection();
      setConnectionStatus(status);
    } finally {
      setCheckingConnection(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Verifica conexão com o banco
      const status = await checkDatabaseConnection();
      if (!status.connected) {
        setConnectionStatus(status);
        setErrorMessage("Não foi possível conectar ao banco de dados. Verifique a conexão.");
        return;
      }
      
      try {
        // Verifica primeiro se o usuário existe e está ativo
        const { isActive } = await checkUserActive(values.email);
          
        // Se não tiver dados ou o usuário não estiver ativo
        if (!isActive) {
          // Verifica se o usuário existe e está pendente
          const pendingCheck = await checkUserActive(values.email);
          
          if (pendingCheck.isActive === false) {
            // Usuário existe mas não está ativo
            setErrorMessage("Sua conta está aguardando aprovação do administrador.");
            setShowApprovalInfo(true);
          } else {
            setErrorMessage("Este usuário não está registrado. Por favor, crie uma conta primeiro.");
          }
          return;
        }
        
        // Se chegou aqui, o usuário existe e está ativo, então tenta fazer login
        await login(values.email, values.password);
      } catch (error) {
        console.error("Erro durante o login:", error);
        setErrorMessage("Credenciais inválidas. Verifique seu email e senha.");
      }
    } catch (error) {
      console.error("Erro:", error);
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
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetConnection}
                disabled={checkingConnection}
              >
                {checkingConnection ? "Reconectando..." : "Tentar reconectar"}
              </Button>
            </div>
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
          <Button type="submit" className="w-full" disabled={isLoading || checkingConnection}>
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
      
      <div className="mt-4 text-center">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={checkConnection}
          disabled={checkingConnection}
        >
          {checkingConnection ? (
            <>
              <Loader className="mr-2 h-3 w-3 animate-spin" /> Verificando conexão...
            </>
          ) : (
            "Verificar conexão com banco de dados"
          )}
        </Button>
      </div>
    </>
  );
};

export default LoginForm;
