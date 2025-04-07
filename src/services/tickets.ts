
import { Ticket } from "@/types";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";

export const getTickets = async (): Promise<Ticket[]> => {
  try {
    const result = await query(
      `SELECT * FROM tickets 
       ORDER BY data_criado DESC`
    );

    return result.rows || [];
  } catch (error) {
    console.error("Error fetching tickets:", error);
    toast.error("Erro ao carregar chamados");
    return [];
  }
};

export const getTicketById = async (id: string): Promise<Ticket | undefined> => {
  try {
    const result = await query(
      "SELECT * FROM tickets WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error fetching ticket:", error);
    toast.error("Erro ao carregar chamado");
    return undefined;
  }
};

export const createTicket = async (ticketData: Partial<Omit<Ticket, "id" | "data_criado" | "data_atualizado">>): Promise<Ticket> => {
  try {
    // Auto-set the stage to 1 (Aguardando) if not specified
    if (!ticketData.etapa_numero) {
      ticketData.etapa_numero = 1;
    }
    
    // Validate required fields
    if (!ticketData.email_atendente) {
      throw new Error("Email do atendente é obrigatório");
    }
    
    if (!ticketData.nome) {
      throw new Error("Nome é obrigatório");
    }
    
    if (!ticketData.motivo) {
      throw new Error("Motivo é obrigatório");
    }
    
    if (!ticketData.user_ns) {
      throw new Error("ID do usuário é obrigatório");
    }
    
    const result = await query(
      `INSERT INTO tickets (
         nome, telefone, user_ns, motivo, setor, email_atendente, 
         etapa_numero, numero_sistema
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        ticketData.nome,
        ticketData.telefone,
        ticketData.user_ns,
        ticketData.motivo,
        ticketData.setor,
        ticketData.email_atendente,
        ticketData.etapa_numero,
        ticketData.numero_sistema
      ]
    );

    toast.success("Chamado criado com sucesso");
    return result.rows[0];
  } catch (error) {
    console.error("Error creating ticket:", error);
    toast.error("Erro ao criar chamado");
    throw error;
  }
};

export const updateTicket = async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
  try {
    // Construct the SET part of the SQL query dynamically
    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    // Add each update field to the query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCounter++}`);
        values.push(value);
      }
    });
    
    // Add update timestamp
    fields.push(`data_atualizado = NOW()`);
    
    // If etapa_numero is changing from 1 to something else, set data_saida_etapa1
    if (updates.etapa_numero && updates.etapa_numero !== 1) {
      const currentTicket = await getTicketById(id);
      if (currentTicket && currentTicket.etapa_numero === 1) {
        fields.push(`data_saida_etapa1 = NOW()`);
      }
    }
    
    // Add the id to the values array
    values.push(id);
    
    // Execute the update query
    const result = await query(
      `UPDATE tickets 
       SET ${fields.join(', ')} 
       WHERE id = $${paramCounter} 
       RETURNING *`,
      values
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error updating ticket:", error);
    toast.error("Erro ao atualizar chamado");
    throw error;
  }
};

export const deleteTicket = async (id: string): Promise<void> => {
  try {
    await query(
      "DELETE FROM tickets WHERE id = $1",
      [id]
    );

    toast.success("Chamado excluído com sucesso");
  } catch (error) {
    console.error("Error deleting ticket:", error);
    toast.error("Erro ao excluir chamado");
    throw error;
  }
};
