
import { Agent } from "@/types";
import { supabase, isUsingPostgresDirect } from "@/integrations/supabase/client";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";

/**
 * Retrieves all agents from the database
 */
export const getAgents = async (): Promise<Agent[]> => {
  try {
    if (isUsingPostgresDirect) {
      // Using direct PostgreSQL
      const result = await query('SELECT * FROM atendentes');
      return result.rows || [];
    } else {
      // Using Supabase
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
