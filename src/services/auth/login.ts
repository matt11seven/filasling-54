
import { User } from "@/types";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";
import { LoginUser, verifyPassword, handleServiceError } from "./utils";

/**
 * Função para fazer login do usuário
 */
export const login = async (
  username: string,
  password: string
): Promise<User> => {
  try {
    // Buscar o usuário pelo nome de usuário
    const result = await query(
      "SELECT id, usuario, senha, admin, ativo FROM login WHERE usuario = $1",
      [username]
    );

    // Verificar se o usuário existe
    if (result.rows.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    // Use a safer type assertion with appropriate property checks
    const row = result.rows[0];
    
    // Verify the row has the expected properties before treating it as LoginUser
    if (!('usuario' in row && 'senha' in row && 'admin' in row && 'ativo' in row)) {
      console.error("Resultado da consulta não contém as propriedades esperadas:", row);
      throw new Error("Dados de usuário inválidos");
    }
    
    const user = row as LoginUser;

    // Verificar se o usuário está ativo
    if (!user.ativo) {
      throw new Error("Usuário desativado");
    }

    // Verificar senha
    // Em produção, usaríamos bcrypt.compare
    // No lado do cliente, simulamos a verificação
    const passwordIsValid = import.meta.env.DEV 
      ? true // Simulação: sempre válido em DEV
      : verifyPassword(password, user.senha);

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
    return handleServiceError(error, "Erro ao fazer login");
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
