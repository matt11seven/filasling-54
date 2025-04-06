
export interface User {
  id: string;
  usuario: string;
  isAdmin?: boolean;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface Stage {
  id: string;
  nome: string;
  cor: string;
  numero: number;
}

export interface Ticket {
  id: string;
  nome_sistema: string;
  numero_sistema: number;
  nome: string;
  telefone: string;
  email?: string;
  etapa_numero: number;
  data_criacao: string;
  data_modificacao: string;
  atendente_id?: string;
  cpf?: string;
  obs?: string;
  numeropropriedade?: number;
}

export interface Agent {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  cor: string;
}

export interface AppSettings {
  showUserNS: boolean;
  phoneDisplayMode: 'full' | 'partial' | 'none';
  warningTimeMinutes: number;
  criticalTimeMinutes: number;
  fullScreenAlertMinutes: number;
  soundVolume: number;
  notificationSound: string;
  alertSound: string;
  podiumSound: string;
  firstPlaceSound: string;
}

export * from './auth';
