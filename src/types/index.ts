
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
  numeroSistema?: number;
  data_criado?: string;
  data_atualizado?: string;
}

export interface Ticket {
  id: string;
  nome: string;
  telefone?: string;
  user_ns: string;
  motivo: string;
  setor?: string;
  atendente_id?: string;
  email_atendente: string;
  nome_atendente?: string;
  etapa_numero: number;
  numero_sistema?: number;
  url_imagem_atendente?: string;
  data_criado?: string;
  data_atualizado?: string;
  data_saida_etapa1?: string;
  nome_sistema?: string;
  data_criacao?: string;
  data_modificacao?: string;
  email?: string;
  cpf?: string;
  obs?: string;
  numeropropriedade?: number;
}

export interface Agent {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  cor?: string;
  url_imagem?: string;
  data_criado?: string;
  data_atualizado?: string;
}

export interface AppSettings {
  showUserNS: boolean;
  phoneDisplayMode: 'full' | 'partial' | 'hidden';
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
