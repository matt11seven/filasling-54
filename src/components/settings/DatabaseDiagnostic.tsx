
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { toast } from "sonner";
import { checkDatabaseConnection } from "@/services/connectionTest";

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

  // Diagnóstico da conexão com o banco de dados
  const handleDiagnosticCheck = async () => {
    try {
      const status = await checkDatabaseConnection();
      setConnectionStatus(status);
      if (status.connected) {
        toast.success("Configurações de banco de dados encontradas!");
      } else {
        toast.error("Problema ao acessar configurações de banco de dados.");
      }
      console.log("Diagnóstico da conexão:", status);
    } catch (error) {
      console.error("Erro ao verificar configurações:", error);
      toast.error("Erro ao verificar configurações de banco de dados");
    }
  };

  return (
    <>
      {(isAdmin || isMaster) && (
        <Button 
          variant="outline" 
          onClick={handleDiagnosticCheck} 
          className="flex items-center gap-1"
        >
          <Database className="h-4 w-4" />
          Diagnosticar BD
        </Button>
      )}
      
      {connectionStatus && (isAdmin || isMaster) && (
        <div className={`mb-6 p-4 rounded-md border ${connectionStatus.connected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <h3 className={`font-medium ${connectionStatus.connected ? 'text-green-700' : 'text-yellow-700'}`}>
            Diagnóstico do Banco de Dados
          </h3>
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
        </div>
      )}
    </>
  );
};

export default DatabaseDiagnostic;
