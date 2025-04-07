
import { query } from '@/integrations/postgres/client';
import { toast } from "sonner";

export interface AttendantPerformance {
  id: string;
  nome: string;
  email: string;
  url_imagem?: string;
  tickets_atendidos: number;
  tempo_medio_segundos: number;
  tempo_medio_formatado: string;
}

export interface StrikeData {
  id: string;
  nome: string;
  email: string;
  url_imagem?: string;
  tickets_em_atraso: number;
}

// Função para obter o ranking dos atendentes mais rápidos
export const getAttendantPerformance = async (): Promise<AttendantPerformance[]> => {
  try {
    const result = await query(`
      SELECT 
        atendente_id,
        nome_atendente,
        email_atendente,
        url_imagem_atendente,
        data_criado,
        data_saida_etapa1
      FROM tickets
      WHERE data_saida_etapa1 IS NOT NULL
      AND atendente_id IS NOT NULL
    `);

    if (!result || !result.rows) {
      console.error("Erro ao obter dados de desempenho: resultado inválido");
      return [];
    }

    // Agrupar por atendente e calcular tempo médio
    const attendantMap = new Map();
    
    result.rows.forEach((ticket: any) => {
      const id = ticket.atendente_id;
      const startTime = new Date(ticket.data_criado).getTime();
      const endTime = new Date(ticket.data_saida_etapa1).getTime();
      const responseTime = (endTime - startTime) / 1000; // Tempo em segundos
      
      if (!attendantMap.has(id)) {
        attendantMap.set(id, {
          id,
          nome: ticket.nome_atendente,
          email: ticket.email_atendente,
          url_imagem: ticket.url_imagem_atendente,
          totalTime: responseTime,
          count: 1
        });
      } else {
        const current = attendantMap.get(id);
        current.totalTime += responseTime;
        current.count += 1;
        attendantMap.set(id, current);
      }
    });
    
    // Converter para array e calcular médias
    const result2 = Array.from(attendantMap.values()).map(item => {
      const tempo_medio_segundos = Math.round(item.totalTime / item.count);
      
      // Formatar o tempo médio
      const horas = Math.floor(tempo_medio_segundos / 3600);
      const minutos = Math.floor((tempo_medio_segundos % 3600) / 60);
      const segundos = tempo_medio_segundos % 60;
      
      let tempo_medio_formatado = '';
      if (horas > 0) tempo_medio_formatado += `${horas}h `;
      if (minutos > 0 || horas > 0) tempo_medio_formatado += `${minutos}m `;
      tempo_medio_formatado += `${segundos}s`;
      
      return {
        id: item.id,
        nome: item.nome,
        email: item.email,
        url_imagem: item.url_imagem,
        tickets_atendidos: item.count,
        tempo_medio_segundos,
        tempo_medio_formatado
      };
    });
    
    // Ordenar por tempo médio (mais rápido primeiro)
    return result2.sort((a, b) => a.tempo_medio_segundos - b.tempo_medio_segundos);
  } catch (error) {
    console.error("Erro ao processar dados de desempenho:", error);
    toast.error("Erro ao carregar dados de desempenho");
    return [];
  }
};

// Função para obter tickets em atraso por atendente
export const getAttendantStrikes = async (criticalTimeMinutes: number): Promise<StrikeData[]> => {
  try {
    // Obter tickets que estão na etapa 1 (aguardando)
    const result = await query(`
      SELECT
        id,
        atendente_id,
        nome_atendente,
        email_atendente,
        url_imagem_atendente,
        data_criado,
        etapa_numero
      FROM tickets
      WHERE etapa_numero = 1
    `);

    if (!result || !result.rows) {
      console.error("Erro ao obter dados de strikes: resultado inválido");
      return [];
    }
    
    // Filtrar tickets em atraso e agrupar por atendente
    const attendantMap = new Map();
    const now = new Date();
    const criticalTimeMs = criticalTimeMinutes * 60 * 1000;
    
    result.rows.forEach((ticket: any) => {
      const ticketTime = new Date(ticket.data_criado).getTime();
      const elapsedTime = now.getTime() - ticketTime;
      
      if (elapsedTime >= criticalTimeMs) {
        const id = ticket.atendente_id || 'sem-atendente';
        const nome = ticket.nome_atendente || 'Sem Atendente';
        const email = ticket.email_atendente || 'N/A';
        const url_imagem = ticket.url_imagem_atendente;
        
        if (!attendantMap.has(id)) {
          attendantMap.set(id, {
            id,
            nome,
            email,
            url_imagem,
            tickets_em_atraso: 1
          });
        } else {
          const current = attendantMap.get(id);
          current.tickets_em_atraso += 1;
          attendantMap.set(id, current);
        }
      }
    });
    
    // Converter para array e ordenar por número de tickets em atraso (mais alto primeiro)
    return Array.from(attendantMap.values())
      .sort((a, b) => b.tickets_em_atraso - a.tickets_em_atraso);
    
  } catch (error) {
    console.error("Erro ao processar dados de strikes:", error);
    toast.error("Erro ao carregar dados de strikes");
    return [];
  }
};
