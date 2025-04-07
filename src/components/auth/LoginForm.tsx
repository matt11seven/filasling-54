
import { useEffect } from "react";
import { useLoginForm } from "@/hooks/useLoginForm";
import ConnectionAlert from "./ConnectionAlert";
import ApprovalAlert from "./ApprovalAlert";
import ErrorAlert from "./ErrorAlert";
import LoginFormFields from "./LoginFormFields";
import { checkDatabaseConnection } from "@/services/connectionTest";

interface LoginFormProps {
  onSwitchMode: () => void;
  onLoginSuccess?: () => void;
}

const LoginForm = ({ onSwitchMode }: LoginFormProps) => {
  const {
    form,
    isLoading,
    showApprovalInfo,
    errorMessage,
    connectionStatus,
    setConnectionStatus,
    onSubmit
  } = useLoginForm();
  
  // Verificar conexão ao inicializar o componente
  useEffect(() => {
    const verifyConnection = async () => {
      try {
        const status = await checkDatabaseConnection();
        setConnectionStatus(status);
        console.log("[LoginForm] Status inicial de conexão:", status);
      } catch (err) {
        console.error("[LoginForm] Erro ao verificar conexão:", err);
      }
    };
    
    verifyConnection();
  }, [setConnectionStatus]);

  return (
    <>
      <ConnectionAlert connectionStatus={connectionStatus} />
      <ApprovalAlert show={showApprovalInfo} />
      <ErrorAlert message={errorMessage} />
      <LoginFormFields
        form={form}
        isLoading={isLoading}
        onSubmit={onSubmit}
        onSwitchMode={onSwitchMode}
      />
    </>
  );
};

export default LoginForm;
