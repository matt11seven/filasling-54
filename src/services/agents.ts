
import { Agent } from "@/types";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";

export const getAgents = async (): Promise<Agent[]> => {
  try {
    // Verificar se o token está presente
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.log("⚠️ Token de autenticação ausente, não é possível buscar atendentes");
      return [];
    }

    // Primeiro tenta buscar da API
    try {
      const response = await fetch('/api/atendentes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Se for erro de autenticação, não tentar fallback
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (apiError) {
      // Somente fazer fallback se não for erro de autenticação
      if (apiError.message === "Unauthorized") {
        throw apiError;
      }
      
      // Fallback para banco local
      console.log("Falling back to local database query for agents");
      const result = await query("SELECT * FROM atendentes");
      return (result.rows || []) as Agent[];
    }
  } catch (error) {
    console.error("Error fetching agents:", error);
    
    // Não mostrar toast de erro se for apenas falta de autenticação
    if (!(error instanceof Error && error.message.includes("Unauthorized"))) {
      toast.error("Erro ao carregar atendentes");
    }
    
    return [];
  }
};

export const getAgentById = async (id: string): Promise<Agent | undefined> => {
  try {
    const result = await query(
      "SELECT * FROM atendentes WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return result.rows[0] as Agent;
  } catch (error) {
    console.error("Error fetching agent:", error);
    toast.error("Erro ao carregar atendente");
    return undefined;
  }
};

export const getAgentByEmail = async (email: string): Promise<Agent | undefined> => {
  try {
    const result = await query(
      "SELECT * FROM atendentes WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return result.rows[0] as Agent;
  } catch (error) {
    console.error("Error fetching agent by email:", error);
    return undefined;
  }
};

export const createAgent = async (agent: Omit<Agent, "id" | "data_criado" | "data_atualizado">): Promise<Agent> => {
  try {
    const result = await query(
      `INSERT INTO atendentes (
         nome, email, url_imagem, ativo
       ) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [
        agent.nome,
        agent.email,
        agent.url_imagem || null,
        agent.ativo === undefined ? true : agent.ativo
      ]
    );

    toast.success("Atendente criado com sucesso");
    return result.rows[0] as Agent;
  } catch (error) {
    console.error("Error creating agent:", error);
    toast.error("Erro ao criar atendente");
    throw error;
  }
};

export const updateAgent = async (id: string, updates: Partial<Agent>): Promise<Agent> => {
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
    
    // Add the id to the values array
    values.push(id);
    
    // Execute the update query
    const result = await query(
      `UPDATE atendentes 
       SET ${fields.join(', ')} 
       WHERE id = $${paramCounter} 
       RETURNING *`,
      values
    );

    toast.success("Atendente atualizado com sucesso");
    return result.rows[0] as Agent;
  } catch (error) {
    console.error("Error updating agent:", error);
    toast.error("Erro ao atualizar atendente");
    throw error;
  }
};

export const deleteAgent = async (id: string): Promise<void> => {
  try {
    await query(
      "DELETE FROM atendentes WHERE id = $1",
      [id]
    );

    toast.success("Atendente excluído com sucesso");
  } catch (error) {
    console.error("Error deleting agent:", error);
    toast.error("Erro ao excluir atendente");
    throw error;
  }
};
