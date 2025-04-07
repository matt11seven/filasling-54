
import { toast } from "sonner";

/**
 * Função para encerrar a sessão (no cliente, apenas limpa o estado)
 */
export const logout = async (): Promise<void> => {
  // No lado do cliente, não precisamos fazer nada além de limpar o estado local
  // Isso é feito no Context do React
  console.log("Usuário realizou logout");
  toast.success("Logout realizado com sucesso");
  return Promise.resolve();
};
