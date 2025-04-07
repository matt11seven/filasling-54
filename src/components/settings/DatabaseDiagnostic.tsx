
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { checkDatabaseConnection, resetDatabaseConnection } from "@/services/connectionTest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ConnectionStatus = {
  connected: boolean;
  message: string;
  diagnostics?: any;
};

interface DatabaseDiagnosticProps {
  isAdmin: boolean;
  isMaster: boolean;
}

const DatabaseDiagnostic = ({ isAdmin, isMaster }: DatabaseDiagnosticProps) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | undefined>();
  const [isChecking, setIsChecking] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Diagnóstico da conexão com o banco de dados
  const handleDiagnosticCheck = async () => {
    try {
      setIsChecking(true);
      const status = await checkDatabaseConnection();
      setConnectionStatus(status);
      setShowDiagnostics(true);
      
      if (status.connected) {
        toast.success("Configurações de banco de dados encontradas!");
      } else {
        toast.error("Problema ao acessar configurações de banco de dados.");
      }
      console.log("Diagnóstico da conexão:", status);
    } catch (error) {
      console.error("Erro ao verificar configurações:", error);
      toast.error("Erro ao verificar configurações de banco de dados");
      setConnectionStatus({
        connected: false,
        message: "Erro ao verificar conexão com o banco de dados."
      });
      setShowDiagnostics(true);
    } finally {
      setIsChecking(false);
    }
  };

  // Reinicializa a conexão do banco de dados
  const handleResetConnection = async () => {
    try {
      setIsChecking(true);
      const status = await resetDatabaseConnection();
      setConnectionStatus(status);
      
      if (status.connected) {
        toast.success("Conexão com banco de dados reiniciada!");
      } else {
        toast.error("Problema ao reiniciar conexão com banco de dados.");
      }
    } catch (error) {
      console.error("Erro ao reiniciar conexão:", error);
      toast.error("Erro ao reiniciar conexão com banco de dados");
    } finally {
      setIsChecking(false);
    }
  };

  // Fecha o diagnóstico
  const handleCloseDiagnostics = () => {
    setShowDiagnostics(false);
  };

  return (
    <>
      {(isAdmin || isMaster) && (
        <Button 
          variant="outline" 
          onClick={handleDiagnosticCheck} 
          disabled={isChecking}
          className="flex items-center gap-1"
        >
          <Database className="h-4 w-4" />
          {isChecking ? "Verificando..." : "Diagnosticar BD"}
        </Button>
      )}
      
      {connectionStatus && showDiagnostics && (isAdmin || isMaster) && (
        <Card className="mt-6 mb-6 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              Diagnóstico do Banco de Dados
              <Badge className={`ml-2 ${connectionStatus.connected ? 'bg-green-500' : 'bg-yellow-500'}`}>
                {connectionStatus.connected ? 'Conectado' : 'Problema de Conexão'}
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleResetConnection}
                title="Reiniciar conexão"
                disabled={isChecking}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCloseDiagnostics}
              >
                Fechar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-md border ${connectionStatus.connected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <p className={connectionStatus.connected ? 'text-green-600' : 'text-yellow-600'}>
                {connectionStatus.message}
              </p>
              {connectionStatus.diagnostics && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">Detalhes técnicos</summary>
                  <pre className="mt-2 bg-slate-100 p-2 rounded overflow-auto max-h-56 text-xs">
                    {JSON.stringify(connectionStatus.diagnostics, null, 2)}
                  </pre>
                </details>
              )}
              {connectionStatus.connected && (
                <p className="mt-2 text-sm text-green-600">
                  As variáveis de ambiente para conexão com o banco de dados estão configuradas corretamente.
                </p>
              )}
              {!connectionStatus.connected && (
                <div className="mt-2 text-sm text-yellow-600">
                  <p>Possíveis soluções:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Verifique se o arquivo .env contém as variáveis corretas</li>
                    <li>Confirme se o banco de dados está em execução</li>
                    <li>Verifique se o host e porta estão acessíveis</li>
                    <li>Execute o script ./test-db-connection.sh para um diagnóstico detalhado</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default DatabaseDiagnostic;
