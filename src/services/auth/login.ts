
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
    
    // Verificar se é o usuário master (comparação case-insensitive)
    if (username.toLowerCase() === 'matt@slingbr.com') {
      console.log("Login como usuário master detectado");
      
      // Para o usuário master, aceita qualquer senha em ambiente de desenvolvimento
      if (import.meta.env.DEV || password === 'senha_master_correta') {
        console.log("Login master autorizado");
        // Retornar dados do usuário master sem verificar no banco
        return {
          id: '1',
          usuario: username,
          isAdmin: true
        };
      } else {
        console.log("Senha incorreta para usuário master");
        throw new Error("Credenciais inválidas para usuário master");
      }
    }
    
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

    // Get the row data
    const row = result.rows[0];
    
    // Verificar se o row contém os dados esperados
    if (!row || typeof row !== 'object' || !('usuario' in row)) {
      console.error("Resultado da consulta não contém as propriedades esperadas:", row);
      throw new Error("Dados de usuário inválidos");
    }
    
    // Define a temporary interface for the actual row data
    interface DbUserRow {
      id: string;
      usuario: string;
      senha?: string;
      admin?: boolean;
      ativo?: boolean;
    }
    
    // Safely convert to our temporary type
    const dbUser = row as DbUserRow;
    
    // Then construct a proper LoginUser object with defaults for missing properties
    const user: LoginUser = {
      id: dbUser.id || '',
      usuario: dbUser.usuario || '',
      senha: dbUser.senha || '',
      admin: !!dbUser.admin,  // Convert to boolean
      ativo: !!dbUser.ativo   // Convert to boolean
    };
    
    console.log("Usuário encontrado:", { ...user, senha: '***CONFIDENCIAL***' });

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
  
  // Normaliza o email (trim e lowercase) para evitar problemas com espaços ou capitalização
  const normalizedEmail = email.trim().toLowerCase();
  console.log("Email normalizado:", normalizedEmail);
  
  return login(normalizedEmail, password);
};
