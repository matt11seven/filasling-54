
import { Ticket } from "@/types";
import { query, transaction } from "@/integrations/postgres/client";
import { toast } from "sonner";

export const getTickets = async (): Promise<Ticket[]> => {
  try {
    console.log("Fetching tickets...");
    const result = await query(`
      SELECT * FROM tickets
      ORDER BY data_criado DESC
    `);
    
    console.log("Tickets result:", result);
    return (result.rows || []) as Ticket[];
  } catch (error) {
    console.error("Error fetching tickets:", error);
    toast.error("Erro ao carregar tickets");
    return [];
  }
};

export const getTicketById = async (id: string): Promise<Ticket | null> => {
  try {
    const result = await query(
      "SELECT * FROM tickets WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as Ticket;
  } catch (error) {
    console.error("Error fetching ticket:", error);
    toast.error("Erro ao carregar ticket");
    return null;
  }
};

export const createTicket = async (ticketData: Omit<Ticket, "id" | "data_criado" | "data_atualizado">): Promise<Ticket> => {
  try {
    const {
      nome,
      telefone,
      user_ns,
      motivo,
      setor,
      email_atendente,
      nome_atendente,
      atendente_id,
      etapa_numero = 1,
      url_imagem_atendente,
      numero_sistema,
    } = ticketData;

    const result = await query(
      `INSERT INTO tickets (
        nome, 
        telefone, 
        user_ns, 
        motivo, 
        setor,
        email_atendente, 
        nome_atendente,
        atendente_id,
        etapa_numero,
        url_imagem_atendente,
        numero_sistema
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        nome,
        telefone || null,
        user_ns,
        motivo,
        setor || null,
        email_atendente,
        nome_atendente || null,
        atendente_id || null,
        etapa_numero,
        url_imagem_atendente || null,
        numero_sistema || null,
      ]
    );

    toast.success("Ticket criado com sucesso");
    return result.rows[0] as Ticket;
  } catch (error) {
    console.error("Error creating ticket:", error);
    toast.error("Erro ao criar ticket");
    throw error;
  }
};

export const updateTicket = async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
  try {
    return await transaction(async (client) => {
      // Verificar se o ticket está na etapa 1 e vai ser atualizado para outra etapa
      if (updates.etapa_numero && updates.etapa_numero !== 1) {
        const currentTicket = await client.query(
          "SELECT etapa_numero, data_saida_etapa1 FROM tickets WHERE id = $1",
          [id]
        );
        
        if (
          currentTicket.rows.length > 0 &&
          currentTicket.rows[0].etapa_numero === 1 &&
          !currentTicket.rows[0].data_saida_etapa1
        ) {
          // Se estiver saindo da etapa 1, registrar o timestamp
          updates.data_saida_etapa1 = new Date().toISOString();
        }
      }
      
      // Construir a query de atualização dinamicamente
      const fields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;
      
      // Adicionar cada campo a ser atualizado
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = $${paramCounter++}`);
          values.push(value);
        }
      });
      
      // Adicionar o timestamp de atualização
      fields.push(`data_atualizado = NOW()`);
      
      // Adicionar o ID à lista de valores
      values.push(id);
      
      // Executar a query de atualização
      const result = await client.query(
        `UPDATE tickets 
         SET ${fields.join(', ')} 
         WHERE id = $${paramCounter} 
         RETURNING *`,
        values
      );

      return result.rows[0] as Ticket;
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    toast.error("Erro ao atualizar ticket");
    throw error;
  }
};

export const deleteTicket = async (id: string): Promise<void> => {
  try {
    await query(
      "DELETE FROM tickets WHERE id = $1",
      [id]
    );

    toast.success("Ticket excluído com sucesso");
  } catch (error) {
    console.error("Error deleting ticket:", error);
    toast.error("Erro ao excluir ticket");
    throw error;
  }
};
