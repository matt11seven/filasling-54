
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
      // Using direct PostgreSQL with timeout
      const queryPromise = query('SELECT * FROM atendentes');
      
      // Add timeout to prevent blocking the UI for too long
      const timeoutPromise = new Promise<{rows: any[]}>((resolve) => {
        setTimeout(() => {
          console.warn("Timeout ao buscar agentes do PostgreSQL");
          resolve({ rows: [] });
        }, 5000);
      });
      
      // Use Promise.race to ensure it doesn't block for too long
      const result = await Promise.race([queryPromise, timeoutPromise]);
      return result.rows || [];
    } else {
      // Using Supabase
      const { data, error } = await supabase
        .from("atendentes")
        .select("*");

      if (error) {
        console.error("Error fetching agents:", error);
        return []; // Return empty array instead of throwing error
      }

      return data || [];
    }
  } catch (error) {
    console.error("Error in getAgents:", error);
    toast.error("Erro ao carregar atendentes");
    return []; // Always return at least an empty array
  }
};
