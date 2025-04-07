
import { InfoIcon } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ConnectionAlertProps {
  connectionStatus: {
    connected: boolean;
    message?: string;
    diagnostics?: any;
  };
}

const ConnectionAlert = ({ connectionStatus }: ConnectionAlertProps) => {
  if (connectionStatus.connected) return null;
  
  return (
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
  );
};

export default ConnectionAlert;
