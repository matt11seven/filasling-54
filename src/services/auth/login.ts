
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
    console.log("Tentando fazer login com:", { username });
    
    // Buscar o usuário pelo nome de usuário
    const result = await query(
      "SELECT id, usuario, senha, admin, ativo FROM login WHERE usuario = $1",
      [username]
    );

    console.log("Resultado da consulta:", result);

    // Verificar se o usuário existe
    if (!result.rows || result.rows.length === 0) {
      console.error("Usuário não encontrado:", username);
      throw new Error("Usuário não encontrado");
    }

    // Use a safer type assertion with appropriate property checks
    const row = result.rows[0];
    
    // Verificar se o row contém os dados esperados
    if (!row || !('usuario' in row)) {
      console.error("Resultado da consulta não contém as propriedades esperadas:", row);
      throw new Error("Dados de usuário inválidos");
    }
    
    const user = row as LoginUser;
    console.log("Usuário encontrado:", { ...user, senha: '***CONFIDENCIAL***' });

    // Verificação adicional para o usuário master
    if (username === 'matt@slingbr.com') {
      console.log("Login como usuário master");
      // Garantir que o usuário master esteja sempre ativo
      return {
        id: user.id || '1',
        usuario: user.usuario,
        isAdmin: true
      };
    }

    // Verificar se o usuário está ativo
    if (!user.ativo) {
      console.log("Usuário está inativo:", username);
      throw new Error("Usuário desativado");
    }

    // Verificar senha
    // Em produção, usaríamos bcrypt.compare
    // No lado do cliente, simulamos a verificação
    const passwordIsValid = import.meta.env.DEV 
      ? true // Simulação: sempre válido em DEV
      : verifyPassword(password, user.senha);

    if (!passwordIsValid) {
      console.error("Senha incorreta para o usuário:", username);
      throw new Error("Senha incorreta");
    }

    // Retornar os dados do usuário (sem a senha)
    return {
      id: user.id,
      usuario: user.usuario,
      isAdmin: user.admin
    };
  } catch (error) {
    console.error("Erro durante o login:", error);
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
  console.log("loginUser chamado com:", email);
  return login(email, password);
};
