
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import AuthFooter from "@/components/auth/AuthFooter";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw, Server, Wifi, WifiOff } from "lucide-react";
import { testDatabaseConnection, getConnectionConfig, resetConnection, getSuggestedFixes } from "@/services/connectionTest";
import { toast } from "sonner";

const LoginPage = () => {
  const { isAuthenticated } = useAuth();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showApprovalInfo, setShowApprovalInfo] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
  const [suggestedFixes, setSuggestedFixes] = useState<string[]>([]);
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
      setConnectionStatus(success ? 'success' : 'error');
      if (success) {
        toast.success("Conexão com o banco de dados estabelecida com sucesso!");
        setSuggestedFixes([]);
      } else {
        toast.error("Falha ao conectar ao banco de dados. Verifique as configurações e o console para mais detalhes.");
        setSuggestedFixes(getSuggestedFixes());
        setShowDiagnostics(true); // Mostrar diagnósticos automaticamente em caso de erro
      }
    } finally {
      setIsTesting(false);
    }
  };
  
  // Reset de conexão
  const handleResetConnection = () => {
    resetConnection();
    setShowDiagnostics(true);
    setConnectionStatus('unknown');
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
            
            {/* Status de conexão */}
            {connectionStatus !== 'unknown' && (
              <div className={`mt-2 w-full p-2 rounded-md text-center text-sm font-medium ${
                connectionStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {connectionStatus === 'success' ? (
                  <div className="flex items-center justify-center gap-2">
                    <Wifi className="h-4 w-4" />
                    <span>Conectado ao banco de dados</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <WifiOff className="h-4 w-4" />
                    <span>Problema de conexão com o banco</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Sugestões de correção para problemas de conexão */}
            {connectionStatus === 'error' && suggestedFixes.length > 0 && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs">
                <h4 className="font-medium mb-1">Possíveis soluções:</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {suggestedFixes.map((fix, index) => (
                    <li key={index}>{fix}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Botões de teste de conexão */}
            <div className="mt-4 w-full space-y-2">
              <Button 
                onClick={handleTestConnection}
                variant={connectionStatus === 'error' ? "destructive" : "outline"}
                size="sm"
                className={`text-sm w-full flex items-center gap-2 ${
                  connectionStatus === 'error' ? 'animate-pulse' : ''
                }`}
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
            
            {/* Ajuda sobre hostname com underscores */}
            {showDiagnostics && connectionStatus === 'error' && getConnectionConfig()['host']?.toString().includes('_') && (
              <div className="mt-2 p-2 bg-amber-100 rounded-md text-amber-800 text-xs">
                <p className="font-medium">Problema detectado: hostname contém underscores (_)</p>
                <p className="mt-1">
                  O hostname "{getConnectionConfig()['host']}" contém underscores, o que causa problemas 
                  de resolução DNS em muitos ambientes. <strong>Solução recomendada:</strong> Substitua o 
                  hostname por seu endereço IP diretamente no arquivo .env.
                </p>
                <p className="mt-1">
                  <strong>Como resolver:</strong> Consulte o administrador do sistema para obter o 
                  endereço IP correto do servidor de banco de dados e atualize o arquivo .env com:
                </p>
                <pre className="bg-amber-50 p-1 mt-1 rounded">
                  DB_POSTGRESDB_HOST=endereço.ip.do.servidor
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
