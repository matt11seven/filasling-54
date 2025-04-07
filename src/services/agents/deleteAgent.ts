
import { supabase, isUsingPostgresDirect } from "@/integrations/supabase/client";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";

/**
 * Deletes an agent from the database
 */
export const deleteAgent = async (id: string): Promise<boolean> => {
  try {
    if (isUsingPostgresDirect) {
      // Using direct PostgreSQL with timeout
      const queryPromise = query('DELETE FROM atendentes WHERE id = $1', [id]);
      
      // Add timeout to prevent blocking the UI for too long
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.warn("Timeout ao excluir agente do PostgreSQL");
          toast.error("Timeout ao excluir atendente");
          resolve(false);
        }, 5000);
      });
      
      // Use Promise.race to ensure it doesn't block for too long
      const result = await Promise.race([
        queryPromise.then(() => true), 
        timeoutPromise
      ]);
      
      if (result) {
        toast.success("Atendente excluído com sucesso");
        return true;
      }
      return false;
    } else {
      // Using Supabase
      const { error } = await supabase
        .from("atendentes")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting agent:", error);
        toast.error("Erro ao excluir atendente");
        return false;
      }

      toast.success("Atendente excluído com sucesso");
      return true;
    }
  } catch (error) {
    console.error("Error in deleteAgent:", error);
    toast.error("Erro ao excluir atendente");
    return false;
  }
};
