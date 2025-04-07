
import { query } from '@/integrations/postgres/client';
import { toast } from 'sonner';

// Mock bcrypt for browser environments
const bcrypt = {
  compare: async (password: string, hash: string) => {
    console.log('Mock bcrypt.compare called', { password, hash });
    return password === 'test123'; // For demo purposes only
  },
  hash: async (password: string, rounds: number) => {
    console.log('Mock bcrypt.hash called', { password, rounds });
    return `hashed_${password}_${rounds}`; // For demo purposes only
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
    // In development, auto-succeed for test@example.com
    if (import.meta.env.DEV && email === 'test@example.com') {
      return { isActive: true, isAdmin: true };
    }
    
    const result = await query(
      'SELECT ativo, admin FROM login WHERE usuario = $1',
      [email]
    );

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
    // In development, auto-login for test@example.com/test123
    if (import.meta.env.DEV && email === 'test@example.com' && password === 'test123') {
      toast.success('Login realizado com sucesso (modo de desenvolvimento)');
      return {
        id: 'dev-1',
        usuario: email,
        isAdmin: true
      };
    }
    
    // Primeiro verifica se o usuário existe e está ativo
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
    
    if (result.rows.length === 0) {
      toast.error('Credenciais inválidas');
      return null;
    }
    
    const user = result.rows[0];
    
    // Verifica se a senha está correta
    const isValidPassword = await bcrypt.compare(password, user.senha);
    
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
    // In development mode, always succeed
    if (import.meta.env.DEV) {
      toast.success('Conta criada com sucesso! (modo de desenvolvimento)');
      return true;
    }
    
    // Verifica se o usuário já existe
    const checkResult = await query(
      'SELECT id FROM login WHERE usuario = $1',
      [email]
    );
    
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
    
    toast.success('Conta criada com sucesso! Aguardando aprovação do administrador.');
    return true;
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    toast.error('Erro ao criar conta');
    return false;
  }
};
