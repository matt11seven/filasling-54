
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ConnectionAlertProps {
  connectionStatus: {
    connected: boolean;
    message?: string;
    diagnostics?: any;
  };
}

const ConnectionAlert = ({ connectionStatus }: ConnectionAlertProps) => {
  const [showDetails, setShowDetails] = useState(false);
  
  if (connectionStatus.connected) return null;
  
  return (
    <Alert className="mb-4 bg-yellow-50 border-yellow-200">
      <AlertCircle className="h-4 w-4 text-yellow-500" />
      <AlertTitle className="text-yellow-700">Problema de conexão</AlertTitle>
      <AlertDescription className="text-yellow-600">
        {connectionStatus.message || "Não foi possível conectar ao banco de dados."}
        
        <div className="mt-2 text-sm">
          <p>Possíveis soluções:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Verifique se o contêiner do banco de dados está em execução</li>
            <li>Confirme se as variáveis de ambiente estão configuradas corretamente</li>
            <li>Certifique-se que o script env.sh tenha sido executado ao iniciar o contêiner</li>
          </ul>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Esconder detalhes" : "Mostrar detalhes técnicos"}
        </Button>
        
        {showDetails && connectionStatus.diagnostics && (
          <div className="mt-2 text-xs">
            <p>Diagnóstico:</p>
            <pre className="bg-yellow-100 p-1 rounded overflow-auto max-h-40">
              {JSON.stringify(connectionStatus.diagnostics, null, 2)}
            </pre>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ConnectionAlert;
