
export interface User {
  id: string;
  usuario: string;
  isAdmin?: boolean;
}

export interface Agent {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  url_imagem?: string;
  data_criado: string;
  data_atualizado: string;
}

export interface Stage {
  id: string;
  numero: number;
  nome: string;
  cor: string;
  numeroSistema?: number;
  data_criado: string;
  data_atualizado: string;
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
  data_criado: string;
  data_atualizado: string;
  data_saida_etapa1?: string;
}

export interface AppSettings {
  showUserNS: boolean;
  phoneDisplayMode: 'full' | 'partial' | 'hidden';
  warningTimeMinutes: number;
  criticalTimeMinutes: number;
  fullScreenAlertMinutes: number;
  soundVolume: number;
  // Remove the single soundType property
  // soundType: string;
  // Add individual sound properties for different events
  notificationSound: string;
  alertSound: string;
  podiumSound: string;
  firstPlaceSound: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}
