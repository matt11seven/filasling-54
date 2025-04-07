
import { query } from "@/integrations/postgres/client";

/**
 * Verifica se um usuário está ativo
 */
export const checkUserActive = async (email: string): Promise<{ isActive: boolean, exists: boolean }> => {
  try {
    console.log(`📊 [UserStatus] Verificando status do usuário: "${email}" - ${new Date().toISOString()}`);
    
    // Verificação especial para o usuário master
    if (email.toLowerCase() === 'matt@slingbr.com') {
      console.log("✅ [UserStatus] Usuário master detectado na verificação de status");
      return { isActive: true, exists: true };
    }
    
    // Buscar o usuário pelo email (que é o campo usuario na tabela login)
    console.log(`🔍 [UserStatus] Executando query para verificar status do usuário "${email}"`);
    const result = await query(
      "SELECT ativo FROM login WHERE usuario = $1",
      [email]
    );

    console.log(`📊 [UserStatus] Consulta de status - linhas encontradas: ${result.rows ? result.rows.length : 0}`);
    console.log(`📊 [UserStatus] Resultado completo:`, JSON.stringify(result.rows || []));

    // Se não encontrou o usuário
    if (!result.rows || result.rows.length === 0) {
      console.log(`❌ [UserStatus] Status: Usuário "${email}" não encontrado no banco`);
      return { isActive: false, exists: false };
    }

    // Verificamos se o resultado tem a propriedade esperada
    const userRow = result.rows[0];
    
    if (!('ativo' in userRow)) {
      console.error("❌ [UserStatus] Status: Resultado da consulta não contém a propriedade 'ativo':", userRow);
      return { isActive: false, exists: true };
    }

    // Retorna se o usuário está ativo ou não
    const isActive = !!userRow.ativo;
    console.log(`📊 [UserStatus] Status do usuário "${email}": ${isActive ? '✅ ATIVO' : '❌ INATIVO'}`);
    
    return { 
      isActive: isActive, 
      exists: true 
    };
  } catch (error) {
    console.error("🚨 [UserStatus] Erro ao verificar status do usuário:", error);
    return { isActive: false, exists: false };
  }
};
