
import { Agent } from "@/types";
import { supabase, isUsingPostgresDirect } from "@/integrations/supabase/client";
import { query } from "@/integrations/postgres/client";

/**
 * Retrieves a specific agent by email
 */
export const getAgentByEmail = async (email: string): Promise<Agent | undefined> => {
  try {
    if (isUsingPostgresDirect) {
      // Using direct PostgreSQL
      const result = await query('SELECT * FROM atendentes WHERE email = $1', [email]);
      return result.rows[0];
    } else {
      // Using Supabase
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
