
import { useLoginForm } from "@/hooks/useLoginForm";
import ConnectionAlert from "./ConnectionAlert";
import ApprovalAlert from "./ApprovalAlert";
import ErrorAlert from "./ErrorAlert";
import LoginFormFields from "./LoginFormFields";

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
    onSubmit
  } = useLoginForm();

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
