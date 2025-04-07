
import { AttendantPerformance, StrikeData } from "./performance";

// Mock data for development/preview purposes
export const getMockPerformanceData = (): AttendantPerformance[] => {
  return [
    {
      id: "1",
      nome: "Ana Silva",
      email: "ana.silva@example.com",
      url_imagem: "/placeholder.svg",
      tickets_atendidos: 42,
      tempo_medio_segundos: 135,
      tempo_medio_formatado: "2m 15s"
    },
    {
      id: "2",
      nome: "Carlos Oliveira",
      email: "carlos.oliveira@example.com",
      url_imagem: "/placeholder.svg",
      tickets_atendidos: 38,
      tempo_medio_segundos: 180,
      tempo_medio_formatado: "3m 0s"
    },
    {
      id: "3",
      nome: "Mariana Santos",
      email: "mariana.santos@example.com",
      url_imagem: "/placeholder.svg",
      tickets_atendidos: 45,
      tempo_medio_segundos: 210,
      tempo_medio_formatado: "3m 30s"
    },
    {
      id: "4",
      nome: "Pedro Costa",
      email: "pedro.costa@example.com",
      tickets_atendidos: 29,
      tempo_medio_segundos: 250,
      tempo_medio_formatado: "4m 10s"
    },
    {
      id: "5",
      nome: "Juliana Lima",
      email: "juliana.lima@example.com",
      tickets_atendidos: 33,
      tempo_medio_segundos: 195,
      tempo_medio_formatado: "3m 15s"
    }
  ];
};

export const getMockStrikesData = (): StrikeData[] => {
  return [
    {
      id: "2",
      nome: "Carlos Oliveira",
      email: "carlos.oliveira@example.com",
      url_imagem: "/placeholder.svg",
      tickets_em_atraso: 3
    },
    {
      id: "4",
      nome: "Pedro Costa",
      email: "pedro.costa@example.com",
      tickets_em_atraso: 5
    },
    {
      id: "sem-atendente",
      nome: "Sem Atendente",
      email: "N/A",
      tickets_em_atraso: 2
    }
  ];
};
