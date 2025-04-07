
import { InfoIcon } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ErrorAlertProps {
  message: string | null;
}

const ErrorAlert = ({ message }: ErrorAlertProps) => {
  if (!message) return null;
  
  return (
    <Alert className="mb-4 bg-red-50 border-red-200">
      <InfoIcon className="h-4 w-4 text-red-500" />
      <AlertTitle className="text-red-700">Erro</AlertTitle>
      <AlertDescription className="text-red-600">
        {message}
      </AlertDescription>
    </Alert>
  );
};

export default ErrorAlert;
