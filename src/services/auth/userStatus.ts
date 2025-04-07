
import { query } from "@/integrations/postgres/client";

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

    // Verificamos se o resultado tem a propriedade esperada
    const userRow = result.rows[0];
    
    if (!('ativo' in userRow)) {
      console.error("Resultado da consulta não contém a propriedade 'ativo':", userRow);
      return { isActive: false, exists: true };
    }

    // Retorna se o usuário está ativo ou não
    return { 
      isActive: !!userRow.ativo, 
      exists: true 
    };
  } catch (error) {
    console.error("Erro ao verificar status do usuário:", error);
    return { isActive: false, exists: false };
  }
};
