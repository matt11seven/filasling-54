
import { query } from "@/integrations/postgres/client";

/**
 * Verifica se um usuário está ativo
 */
export const checkUserActive = async (email: string): Promise<{ isActive: boolean, exists: boolean }> => {
  try {
    console.log(`📊 [UserStatus] Verificando status do usuário: "${email}" - ${new Date().toISOString()}`);
    
    // Verificação especial para usuários especiais
    if (email.toLowerCase() === 'matt@slingbr.com' || email.toLowerCase() === 'test@slingbr.com') {
      console.log(`✅ [UserStatus] Usuário especial detectado: "${email}"`);
      return { isActive: true, exists: true };
    }
    
    // Obter o token JWT do localStorage
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("🚨 [UserStatus] Token de autenticação não encontrado no localStorage");
      return { isActive: false, exists: false };
    }
    
    try {
      // Buscar o status do usuário diretamente via API
      console.log(`🔍 [UserStatus] Verificando status via API para "${email}"`);
      
      const response = await fetch('/api/auth/login', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`🚨 [UserStatus] API respondeu com status ${response.status}: ${errorText}`);
        
        // Se o erro for 401 (não autenticado), o usuário pode existir mas o token expirou
        if (response.status === 401) {
          console.log(`⚠️ [UserStatus] Token expirado ou inválido para "${email}"`);
          return { isActive: false, exists: true };
        }
        
        return { isActive: false, exists: false };
      }
      
      const userData = await response.json();
      console.log(`📊 [UserStatus] Status via API: `, userData);
      
      return { 
        isActive: userData.ativo !== false, // Consideramos ativo se não for explicitamente false
        exists: true
      };
      
    } catch (apiError) {
      console.error("🚨 [UserStatus] Erro ao verificar status via API:", apiError);
      
      // Tentar verificar no banco de dados local como fallback
      try {
        console.log(`🔍 [UserStatus] Executando query para verificar status do usuário "${email}"`);
        const result = await query<{ ativo: boolean }>('SELECT ativo FROM login WHERE usuario = $1', [email]);
        
        console.log(`📊 [UserStatus] Consulta de status - linhas encontradas: ${result.rowCount}`);
        console.log(`📊 [UserStatus] Resultado completo:`, result.rows);
        
        if (result.rowCount > 0) {
          const isActive = result.rows[0].ativo !== false;
          console.log(`📊 [UserStatus] Status local: Usuário "${email}" ${isActive ? 'ativo' : 'inativo'}`);
          return { isActive, exists: true };
        } else {
          console.log(`❌ [UserStatus] Status: Usuário "${email}" não encontrado no banco`);
          return { isActive: false, exists: false };
        }
      } catch (dbError) {
        console.error("🚨 [UserStatus] Erro ao verificar status no banco local:", dbError);
        return { isActive: false, exists: false };
      }
    }
  } catch (error) {
    console.error("🚨 [UserStatus] Erro ao verificar status do usuário:", error);
    return { isActive: false, exists: false };
  }
};
