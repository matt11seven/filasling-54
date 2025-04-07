
import { query } from '@/integrations/postgres/client';
import { toast } from 'sonner';

// Mock bcrypt for browser environments
const bcrypt = {
  compare: async (password: string, hash: string) => {
    console.log('Mock bcrypt.compare called', { password, hash });
    return password === 'aoladodoresultado2030'; // Para fins de demonstração apenas
  },
  hash: async (password: string, rounds: number) => {
    console.log('Mock bcrypt.hash called', { password, rounds });
    return `hashed_${password}_${rounds}`; // Para fins de demonstração apenas
  }
};

export interface UserData {
  id: string;
  usuario: string;
  isAdmin: boolean;
}

// Verificar se o usuário está ativo
export const checkUserActive = async (email: string): Promise<{ isActive: boolean; isAdmin: boolean }> => {
  try {
    // Usuário master sempre ativo sem necessidade de verificação no banco
    if (email === 'matt@slingbr.com') {
      console.log('Usuário master detectado, acesso liberado sem verificação no banco');
      return { isActive: true, isAdmin: true };
    }
    
    const result = await query(
      'SELECT ativo, admin FROM login WHERE usuario = $1',
      [email]
    );

    console.log('Verificação de usuário ativo:', { email, resultado: result.rows });

    if (result.rows.length === 0) {
      return { isActive: false, isAdmin: false };
    }

    return {
      isActive: result.rows[0].ativo,
      isAdmin: result.rows[0].admin
    };
  } catch (error) {
    console.error('Erro ao verificar status do usuário:', error);
    return { isActive: false, isAdmin: false };
  }
};

// Login de usuário
export const loginUser = async (email: string, password: string): Promise<UserData | null> => {
  try {
    // Usuário master com acesso direto
    if (email === 'matt@slingbr.com' && password === 'aoladodoresultado2030') {
      console.log('Login do usuário master realizado com sucesso');
      toast.success('Login realizado com sucesso (usuário master)');
      return {
        id: 'master-1',
        usuario: email,
        isAdmin: true
      };
    }
    
    // Para outros usuários, verifica se está ativo
    const { isActive, isAdmin } = await checkUserActive(email);
    
    if (!isActive) {
      toast.error('Sua conta está aguardando aprovação do administrador');
      return null;
    }
    
    // Busca os dados do usuário
    const result = await query(
      'SELECT id, usuario, senha FROM login WHERE usuario = $1',
      [email]
    );
    
    console.log('Resultado da busca de usuário:', { email, encontrado: result.rows.length > 0 });
    
    if (result.rows.length === 0) {
      toast.error('Credenciais inválidas');
      return null;
    }
    
    const user = result.rows[0];
    
    // Verifica se a senha está correta
    const isValidPassword = await bcrypt.compare(password, user.senha);
    
    console.log('Verificação de senha:', { válida: isValidPassword });
    
    if (!isValidPassword) {
      toast.error('Credenciais inválidas');
      return null;
    }
    
    toast.success('Login realizado com sucesso');
    
    return {
      id: user.id,
      usuario: user.usuario,
      isAdmin: isAdmin
    };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    toast.error('Erro ao fazer login');
    return null;
  }
};

// Registro de novo usuário
export const signupUser = async (email: string, password: string): Promise<boolean> => {
  try {
    // Não permite cadastrar o usuário master
    if (email === 'matt@slingbr.com') {
      toast.error('Este email não pode ser utilizado para cadastro');
      return false;
    }
    
    // Verifica se o usuário já existe
    const checkResult = await query(
      'SELECT id FROM login WHERE usuario = $1',
      [email]
    );
    
    console.log('Verificação de cadastro existente:', { email, existente: checkResult.rows.length > 0 });
    
    if (checkResult.rows.length > 0) {
      toast.error('Usuário já existe');
      return false;
    }
    
    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Cria o novo usuário
    await query(
      'INSERT INTO login (usuario, senha, admin, ativo) VALUES ($1, $2, $3, $4)',
      [email, hashedPassword, false, false]
    );
    
    console.log('Novo usuário cadastrado com sucesso:', { email, aguardandoAprovação: true });
    toast.success('Conta criada com sucesso! Aguardando aprovação do administrador.');
    return true;
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    toast.error('Erro ao criar conta');
    return false;
  }
};
