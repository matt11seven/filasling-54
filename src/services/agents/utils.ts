
import { toast } from "sonner";
import { supabase, isUsingPostgresDirect } from "@/integrations/supabase/client";
import { query } from "@/integrations/postgres/client";

/**
 * Execute a query using the appropriate database client (Postgres or Supabase)
 */
export const executeQuery = async <T>(
  pgQuery: string,
  pgParams: any[] = [],
  supabaseQuery: () => Promise<{ data: T | null; error: any }>
): Promise<T> => {
  try {
    if (isUsingPostgresDirect) {
      // Using direct PostgreSQL
      const result = await query(pgQuery, pgParams);
      return result.rows;
    } else {
      // Using Supabase
      const { data, error } = await supabaseQuery();

      if (error) {
        console.error("Error executing Supabase query:", error);
        throw new Error(error.message);
      }

      return data as T;
    }
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
};
