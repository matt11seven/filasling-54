
import { User } from "@/types";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";
import { LoginUser, hashPassword, handleServiceError } from "./utils";

/**
 * Função para registrar um novo usuário
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
    const hashedPassword = hashPassword(password);

    // Inserir o novo usuário
    const result = await query(
      `INSERT INTO login (
        usuario, senha, admin, ativo
      ) VALUES ($1, $2, $3, $4) RETURNING id, usuario, admin`,
      [username, hashedPassword, isAdmin, true]
    );

    toast.success("Usuário criado com sucesso");

    // Retornar os dados do usuário (sem a senha)
    const newUser = result.rows[0] as Pick<LoginUser, 'id' | 'usuario' | 'admin'>;
    return {
      id: newUser.id,
      usuario: newUser.usuario,
      isAdmin: newUser.admin
    };
  } catch (error) {
    return handleServiceError(error, "Erro ao registrar usuário");
  }
};

/**
 * Função para registrar um novo usuário (em DEV)
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
