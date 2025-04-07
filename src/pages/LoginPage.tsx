
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import AuthFooter from "@/components/auth/AuthFooter";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw, Server } from "lucide-react";
import { testDatabaseConnection, getConnectionConfig, resetConnection } from "@/services/connectionTest";
import { toast } from "sonner";

const LoginPage = () => {
  const { isAuthenticated } = useAuth();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showApprovalInfo, setShowApprovalInfo] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const navigate = useNavigate();

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
  
  // Testar conexão com o banco de dados
  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const success = await testDatabaseConnection();
      if (success) {
        toast.success("Conexão com o banco de dados estabelecida com sucesso!");
      } else {
        toast.error("Falha ao conectar ao banco de dados. Verifique as configurações.");
      }
    } finally {
      setIsTesting(false);
    }
  };
  
  // Reset de conexão
  const handleResetConnection = () => {
    resetConnection();
    setShowDiagnostics(true);
    toast.info("Conexão com banco reiniciada. Clique em Testar Conexão para verificar novamente.");
  };
  
  // Mostrar/esconder diagnósticos
  const toggleDiagnostics = () => {
    setShowDiagnostics(!showDiagnostics);
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
            
            {/* Botões de teste de conexão */}
            <div className="mt-4 w-full space-y-2">
              <Button 
                onClick={handleTestConnection}
                variant="outline"
                size="sm"
                className="text-sm w-full flex items-center gap-2"
                disabled={isTesting}
              >
                <Database className="h-4 w-4" />
                {isTesting ? "Testando conexão..." : "Testar Conexão com Banco"}
              </Button>
              
              <div className="flex gap-2 w-full">
                <Button 
                  onClick={toggleDiagnostics}
                  variant="ghost"
                  size="sm"
                  className="text-xs flex-1"
                >
                  {showDiagnostics ? "Esconder Diagnósticos" : "Mostrar Diagnósticos"}
                </Button>
                
                <Button 
                  onClick={handleResetConnection}
                  variant="ghost"
                  size="sm"
                  className="text-xs flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Resetar
                </Button>
              </div>
            </div>
            
            {/* Diagnósticos de conexão */}
            {showDiagnostics && (
              <div className="mt-3 p-3 bg-secondary rounded-md text-xs font-mono text-left w-full overflow-auto max-h-48">
                <h3 className="font-bold mb-1 text-muted-foreground">Diagnóstico de Conexão:</h3>
                <pre className="whitespace-pre-wrap break-all text-muted-foreground">
                  {JSON.stringify(getConnectionConfig(), null, 2)}
                </pre>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
