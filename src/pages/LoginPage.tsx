
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import AuthFooter from "@/components/auth/AuthFooter";
import { checkDatabaseConnection } from "@/services/connectionTest";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const LoginPage = () => {
  const { isAuthenticated } = useAuth();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showApprovalInfo, setShowApprovalInfo] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{connected: boolean, message?: string}>();
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const navigate = useNavigate();

  // Verificar conexão com o banco de dados ao carregar a página
  useEffect(() => {
    const checkConnection = async () => {
      setIsCheckingConnection(true);
      try {
        const status = await checkDatabaseConnection();
        setConnectionStatus(status);
      } catch (error) {
        console.error("Erro ao verificar conexão:", error);
        setConnectionStatus({
          connected: false,
          message: "Erro ao verificar conexão com o banco de dados."
        });
      } finally {
        setIsCheckingConnection(false);
      }
    };
    
    checkConnection();
  }, []);

  // Se o usuário já estiver autenticado, redirecione para o dashboard
  if (isAuthenticated) {
    navigate("/dashboard");
  }

  const handleSwitchMode = () => {
    setIsSigningUp(!isSigningUp);
    setShowApprovalInfo(false);
  };

  const handleSignupSuccess = () => {
    setShowApprovalInfo(true);
    setIsSigningUp(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img 
            src="/lovable-uploads/4c7404d8-ef38-4ae1-b736-66ac06729fc0.png" 
            alt="Sling Logo" 
            className="h-16" 
          />
        </div>
        
        {connectionStatus && !connectionStatus.connected && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <InfoIcon className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-700">Problema de conexão</AlertTitle>
            <AlertDescription className="text-red-600">
              {connectionStatus.message || "Não foi possível conectar ao banco de dados. Verifique as configurações."}
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isSigningUp ? "Criar Nova Conta" : "Sistema de Fila de Atendimento"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSigningUp ? (
              <SignupForm 
                onSwitchMode={handleSwitchMode} 
                onSignupSuccess={handleSignupSuccess} 
              />
            ) : (
              <LoginForm 
                onSwitchMode={handleSwitchMode} 
              />
            )}
          </CardContent>
          <CardFooter className="flex-col">
            <AuthFooter />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
