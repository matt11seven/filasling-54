
import { supabase, isUsingPostgresDirect } from "@/integrations/supabase/client";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";

/**
 * Deletes an agent from the database
 */
export const deleteAgent = async (id: string): Promise<void> => {
  try {
    if (isUsingPostgresDirect) {
      // Using direct PostgreSQL
      await query('DELETE FROM atendentes WHERE id = $1', [id]);
      toast.success("Atendente excluído com sucesso");
    } else {
      // Using Supabase
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
