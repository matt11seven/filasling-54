
import { User } from "@/types";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";

// Interface for the user data returned from database
interface LoginUser {
  id: string;
  usuario: string;
  senha: string;
  admin: boolean;
  ativo: boolean;
}

// Encriptação simulada para desenvolvimento
const _hashPassword = (password: string): string => {
  // Na produção, usaríamos bcrypt real
  return `hashed_${password}`;
};

// Verificação simulada de senha para desenvolvimento
const _verifyPassword = (inputPassword: string, storedHash: string): boolean => {
  // Na produção, usaríamos bcrypt.compare
  return storedHash === `hashed_${inputPassword}`;
};

/**
 * Verifica se um usuário está ativo
 */
export const checkUserActive = async (email: string): Promise<{ isActive: boolean, exists: boolean }> => {
  try {
    // Buscar o usuário pelo email (que é o campo usuario na tabela login)
    const result = await query(
      "SELECT ativo FROM login WHERE usuario = $1",
      [email]
    );

    // Se não encontrou o usuário
    if (result.rows.length === 0) {
      return { isActive: false, exists: false };
    }

    // Retorna se o usuário está ativo ou não
    return { 
      isActive: result.rows[0].ativo, 
      exists: true 
    };
  } catch (error) {
    console.error("Erro ao verificar status do usuário:", error);
    return { isActive: false, exists: false };
  }
};

/**
 * Função para fazer login do usuário
 */
export const login = async (
  username: string,
  password: string
): Promise<User> => {
  try {
    // Buscar o usuário pelo nome de usuário
    const result = await query<LoginUser>(
      "SELECT id, usuario, senha, admin, ativo FROM login WHERE usuario = $1",
      [username]
    );

    // Verificar se o usuário existe
    if (result.rows.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    const user = result.rows[0];

    // Verificar se o usuário está ativo
    if (!user.ativo) {
      throw new Error("Usuário desativado");
    }

    // Verificar senha
    // Em produção, usaríamos bcrypt.compare
    // No lado do cliente, simulamos a verificação
    const passwordIsValid = import.meta.env.DEV 
      ? true // Simulação: sempre válido em DEV
      : _verifyPassword(password, user.senha);

    if (!passwordIsValid) {
      throw new Error("Senha incorreta");
    }

    // Retornar os dados do usuário (sem a senha)
    return {
      id: user.id,
      usuario: user.usuario,
      isAdmin: user.admin
    };
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    
    // Lançar uma mensagem de erro amigável para o usuário
    if (error instanceof Error) {
      toast.error(error.message);
      throw error;
    } else {
      toast.error("Erro ao realizar login");
      throw new Error("Erro ao realizar login");
    }
  }
};

/**
 * Função para login (compatível com o AuthContext)
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  return login(email, password);
};

/**
 * Função para registrar um novo usuário
 */
export const signupUser = async (
  email: string,
  password: string,
  isAdmin: boolean = false
): Promise<boolean> => {
  try {
    await register(email, password, isAdmin);
    toast.success("Conta criada com sucesso! Aguarde aprovação do administrador.");
    return true;
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error("Erro ao criar conta");
    }
    return false;
  }
};

/**
 * Função para registrar um novo usuário (em DEV)
 */
export const register = async (
  username: string,
  password: string,
  isAdmin: boolean = false
): Promise<User> => {
  try {
    // Verificar se o usuário já existe
    const checkUser = await query(
      "SELECT id FROM login WHERE usuario = $1",
      [username]
    );

    if (checkUser.rows.length > 0) {
      throw new Error("Usuário já existe");
    }

    // Hash da senha (simulado em DEV)
    const hashedPassword = _hashPassword(password);

    // Inserir o novo usuário
    const result = await query<LoginUser>(
      `INSERT INTO login (
        usuario, senha, admin, ativo
      ) VALUES ($1, $2, $3, $4) RETURNING id, usuario, admin`,
      [username, hashedPassword, isAdmin, true]
    );

    toast.success("Usuário criado com sucesso");

    // Retornar os dados do usuário (sem a senha)
    const newUser = result.rows[0];
    return {
      id: newUser.id,
      usuario: newUser.usuario,
      isAdmin: newUser.admin
    };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    
    if (error instanceof Error) {
      toast.error(error.message);
      throw error;
    } else {
      toast.error("Erro ao registrar usuário");
      throw new Error("Erro ao registrar usuário");
    }
  }
};

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
