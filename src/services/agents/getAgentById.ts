
import { Agent } from "@/types";
import { supabase, isUsingPostgresDirect } from "@/integrations/supabase/client";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";

/**
 * Retrieves a specific agent by ID
 */
export const getAgentById = async (id: string): Promise<Agent | undefined> => {
  try {
    if (isUsingPostgresDirect) {
      // Using direct PostgreSQL
      const result = await query('SELECT * FROM atendentes WHERE id = $1', [id]);
      return result.rows[0];
    } else {
      // Using Supabase
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
