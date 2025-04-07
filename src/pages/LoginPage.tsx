
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import AuthFooter from "@/components/auth/AuthFooter";
import { checkDatabaseConnection } from "@/services/connectionTest";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

const LoginPage = () => {
  const { isAuthenticated } = useAuth();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showApprovalInfo, setShowApprovalInfo] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{connected: boolean, message?: string, diagnostics?: any}>();
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const navigate = useNavigate();

  // Verificar conexão com o banco de dados ao carregar a página
  useEffect(() => {
    const checkConnection = async () => {
      setIsCheckingConnection(true);
      try {
        const status = await checkDatabaseConnection();
        setConnectionStatus(status);
        console.log("[Login] Status de conexão do banco de dados:", status);
      } catch (error) {
        console.error("[Login] Erro ao verificar conexão:", error);
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
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSwitchMode = () => {
    setIsSigningUp(!isSigningUp);
    setShowApprovalInfo(false);
  };

  const handleSignupSuccess = () => {
    setShowApprovalInfo(true);
    setIsSigningUp(false);
  };

  const handleDiagnosticCheck = async () => {
    setIsCheckingConnection(true);
    try {
      const status = await checkDatabaseConnection();
      setConnectionStatus(status);
      console.log("[Login] Diagnóstico da conexão:", status);
    } catch (error) {
      console.error("[Login] Erro ao verificar conexão:", error);
      setConnectionStatus({
        connected: false,
        message: "Erro ao verificar conexão com o banco de dados."
      });
    } finally {
      setIsCheckingConnection(false);
    }
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
              {connectionStatus.message || "Não foi possível conectar ao banco de dados. Verifique as variáveis de ambiente."}
              
              {connectionStatus.diagnostics && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">Detalhes técnicos</summary>
                  <pre className="mt-2 bg-slate-100 p-2 rounded overflow-auto max-h-40 text-xs">
                    {JSON.stringify(connectionStatus.diagnostics, null, 2)}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-end mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDiagnosticCheck}
            disabled={isCheckingConnection}
            className="flex items-center gap-1 text-xs"
          >
            <Database className="h-3 w-3" />
            {isCheckingConnection ? "Verificando..." : "Diagnosticar BD"}
          </Button>
        </div>
        
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
