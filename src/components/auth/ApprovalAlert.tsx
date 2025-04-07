
import { InfoIcon } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ApprovalAlertProps {
  show: boolean;
}

const ApprovalAlert = ({ show }: ApprovalAlertProps) => {
  if (!show) return null;
  
  return (
    <Alert className="mb-4 bg-green-50 border-green-200">
      <InfoIcon className="h-4 w-4 text-green-500" />
      <AlertTitle className="text-green-700">Aguardando aprovação</AlertTitle>
      <AlertDescription className="text-green-600">
        Sua conta foi criada e está aguardando aprovação do administrador. Você receberá uma notificação quando sua conta for aprovada.
      </AlertDescription>
    </Alert>
  );
};

export default ApprovalAlert;
