
import { Agent } from "@/types";
import { supabase, isUsingPostgresDirect } from "@/integrations/supabase/client";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";

/**
 * Updates an existing agent in the database
 */
export const updateAgent = async (id: string, updates: Partial<Agent>): Promise<Agent> => {
  try {
    if (isUsingPostgresDirect) {
      // Build dynamic query for update
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
      
      values.push(id); // The last parameter is the ID
      
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
      // Using Supabase
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
