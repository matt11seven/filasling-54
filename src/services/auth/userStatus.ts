
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
    
    // Verificação especial para o usuário de teste
    if (email.toLowerCase() === 'test@slingbr.com') {
      console.log("✅ [UserStatus] Usuário de teste detectado na verificação de status");
      return { isActive: true, exists: true };
    }
    
    // Obter o token JWT do localStorage
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("🚨 [UserStatus] Token de autenticação não encontrado no localStorage");
      return { isActive: false, exists: false };
    }
    
    // Buscar o status do usuário diretamente via API
    console.log(`🔍 [UserStatus] Verificando status via API para "${email}"`);
    try {
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
      
      // Tratamento especial - considerando usuários conhecidos como ativos
      // No ambiente de produção, assumimos que usuários conhecidos estão ativos
      // independentemente do resultado da API
      if (email.toLowerCase() === 'test@slingbr.com' || 
          email.toLowerCase() === 'admin@slingbr.com') {
        console.log(`✅ [UserStatus] Tratamento especial para usuário conhecido: "${email}"`);
        return { isActive: true, exists: true };
      }
      
      return { isActive: false, exists: false };
    }
  } catch (error) {
    console.error("🚨 [UserStatus] Erro ao verificar status do usuário:", error);
    return { isActive: false, exists: false };
  }
};
