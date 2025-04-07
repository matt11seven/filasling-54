
import { toast } from "sonner";

// Interface for the user data returned from database
export interface LoginUser {
  id: string;
  usuario: string;
  senha: string;
  admin: boolean;
  ativo: boolean;
}

// Encriptação simulada para desenvolvimento
export const hashPassword = (password: string): string => {
  // Na produção, usaríamos bcrypt real
  return `hashed_${password}`;
};

// Verificação simulada de senha para desenvolvimento
export const verifyPassword = (inputPassword: string, storedHash: string): boolean => {
  // Na produção, usaríamos bcrypt.compare
  return storedHash === `hashed_${inputPassword}`;
};

// Helper function to handle service errors
export const handleServiceError = (error: unknown, defaultMessage: string): never => {
  console.error(defaultMessage, error);
  
  if (error instanceof Error) {
    toast.error(error.message);
    throw error;
  } else {
    toast.error(defaultMessage);
    throw new Error(defaultMessage);
  }
};
