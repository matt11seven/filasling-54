
import { Agent } from "@/types";
import { supabase, isUsingPostgresDirect } from "@/integrations/supabase/client";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";

/**
 * Creates a new agent in the database
 */
export const createAgent = async (agent: Omit<Agent, "id" | "data_criado" | "data_atualizado">): Promise<Agent> => {
  try {
    if (isUsingPostgresDirect) {
      // Using direct PostgreSQL
      const result = await query(
        'INSERT INTO atendentes (nome, email, ativo, url_imagem) VALUES ($1, $2, $3, $4) RETURNING *',
        [agent.nome, agent.email, agent.ativo, agent.url_imagem]
      );
      
      toast.success("Atendente criado com sucesso");
      return result.rows[0];
    } else {
      // Using Supabase
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
