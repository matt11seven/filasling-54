
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
      [username, hashedPassword, isAdmin, false] // Mudamos para false para que novos usuários aguardem aprovação
    );

    if (!result || !result.rows || result.rows.length === 0) {
      throw new Error("Falha ao criar usuário: sem resultado do banco de dados");
    }

    // Tipar corretamente o resultado da consulta
    interface UserRow {
      id: string | number;
      usuario?: string;
      admin?: boolean;
    }
    
    const rowData = result.rows[0] as UserRow;
    
    if (!rowData) {
      throw new Error("Dados de usuário inválidos após inserção");
    }
    
    console.log("Dados retornados após cadastro:", rowData);
    
    // Retornar os dados do usuário (sem a senha)
    const newUser: User = {
      id: rowData.id ? String(rowData.id) : '',
      usuario: rowData.usuario ? String(rowData.usuario) : username,
      isAdmin: rowData.admin === true
    };
    
    toast.success("Usuário criado com sucesso. Aguardando aprovação do administrador.");
    
    return newUser;
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
