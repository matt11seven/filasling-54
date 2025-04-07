
import { Agent } from "@/types";
import { supabase, isUsingPostgresDirect } from "@/integrations/supabase/client";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";

export const getAgents = async (): Promise<Agent[]> => {
  try {
    if (isUsingPostgresDirect) {
      // Usando PostgreSQL direto
      const result = await query('SELECT * FROM atendentes');
      return result.rows || [];
    } else {
      // Usando Supabase
      const { data, error } = await supabase
        .from("atendentes")
        .select("*");

      if (error) {
        console.error("Error fetching agents:", error);
        throw new Error(error.message);
      }

      return data || [];
    }
  } catch (error) {
    console.error("Error in getAgents:", error);
    toast.error("Erro ao carregar atendentes");
    return [];
  }
};

export const getAgentById = async (id: string): Promise<Agent | undefined> => {
  try {
    if (isUsingPostgresDirect) {
      // Usando PostgreSQL direto
      const result = await query('SELECT * FROM atendentes WHERE id = $1', [id]);
      return result.rows[0];
    } else {
      // Usando Supabase
      const { data, error } = await supabase
        .from("atendentes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching agent:", error);
        throw new Error(error.message);
      }

      return data;
    }
  } catch (error) {
    console.error("Error in getAgentById:", error);
    toast.error("Erro ao carregar atendente");
    return undefined;
  }
};

export const getAgentByEmail = async (email: string): Promise<Agent | undefined> => {
  try {
    if (isUsingPostgresDirect) {
      // Usando PostgreSQL direto
      const result = await query('SELECT * FROM atendentes WHERE email = $1', [email]);
      return result.rows[0];
    } else {
      // Usando Supabase
      const { data, error } = await supabase
        .from("atendentes")
        .select("*")
        .eq("email", email)
        .single();

      if (error && error.code !== 'PGRST116') { // No rows found is not a real error
        console.error("Error fetching agent by email:", error);
        throw new Error(error.message);
      }

      return data;
    }
  } catch (error) {
    console.error("Error in getAgentByEmail:", error);
    return undefined;
  }
};

export const createAgent = async (agent: Omit<Agent, "id" | "data_criado" | "data_atualizado">): Promise<Agent> => {
  try {
    if (isUsingPostgresDirect) {
      // Usando PostgreSQL direto
      const result = await query(
        'INSERT INTO atendentes (nome, email, ativo, url_imagem) VALUES ($1, $2, $3, $4) RETURNING *',
        [agent.nome, agent.email, agent.ativo, agent.url_imagem]
      );
      
      toast.success("Atendente criado com sucesso");
      return result.rows[0];
    } else {
      // Usando Supabase
      const { data, error } = await supabase
        .from("atendentes")
        .insert(agent)
        .select()
        .single();

      if (error) {
        console.error("Error creating agent:", error);
        throw new Error(error.message);
      }

      toast.success("Atendente criado com sucesso");
      return data;
    }
  } catch (error) {
    console.error("Error in createAgent:", error);
    toast.error("Erro ao criar atendente");
    throw error;
  }
};

export const updateAgent = async (id: string, updates: Partial<Agent>): Promise<Agent> => {
  try {
    if (isUsingPostgresDirect) {
      // Construir query dinâmica para atualização
      const setClauses = [];
      const values = [];
      let paramIndex = 1;
      
      if (updates.nome !== undefined) {
        setClauses.push(`nome = $${paramIndex}`);
        values.push(updates.nome);
        paramIndex++;
      }
      
      if (updates.email !== undefined) {
        setClauses.push(`email = $${paramIndex}`);
        values.push(updates.email);
        paramIndex++;
      }
      
      if (updates.ativo !== undefined) {
        setClauses.push(`ativo = $${paramIndex}`);
        values.push(updates.ativo);
        paramIndex++;
      }
      
      if (updates.url_imagem !== undefined) {
        setClauses.push(`url_imagem = $${paramIndex}`);
        values.push(updates.url_imagem);
        paramIndex++;
      }
      
      if (setClauses.length === 0) {
        throw new Error("Nenhum campo para atualizar");
      }
      
      values.push(id); // O último parâmetro é o ID
      
      const queryText = `
        UPDATE atendentes 
        SET ${setClauses.join(', ')}, data_atualizado = NOW() 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      
      const result = await query(queryText, values);
      
      toast.success("Atendente atualizado com sucesso");
      return result.rows[0];
    } else {
      // Usando Supabase
      const { data, error } = await supabase
        .from("atendentes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating agent:", error);
        throw new Error(error.message);
      }

      toast.success("Atendente atualizado com sucesso");
      return data;
    }
  } catch (error) {
    console.error("Error in updateAgent:", error);
    toast.error("Erro ao atualizar atendente");
    throw error;
  }
};

export const deleteAgent = async (id: string): Promise<void> => {
  try {
    if (isUsingPostgresDirect) {
      // Usando PostgreSQL direto
      await query('DELETE FROM atendentes WHERE id = $1', [id]);
      toast.success("Atendente excluído com sucesso");
    } else {
      // Usando Supabase
      const { error } = await supabase
        .from("atendentes")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting agent:", error);
        throw new Error(error.message);
      }

      toast.success("Atendente excluído com sucesso");
    }
  } catch (error) {
    console.error("Error in deleteAgent:", error);
    toast.error("Erro ao excluir atendente");
    throw error;
  }
};
