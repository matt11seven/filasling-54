
import { Stage } from "@/types";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";

export const getStages = async (): Promise<Stage[]> => {
  try {
    console.log("Fetching stages from API...");
    
    // Tenta buscar do endpoint API primeiro
    try {
      const response = await fetch('/api/etapas');
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Stages from API:", data);
      return data || [];
    } catch (apiError) {
      console.error("Error fetching stages from API:", apiError);
      console.log("Falling back to local database query...");
      
      // Fallback para busca local se a API falhar
      const result = await query(`
        SELECT id, nome, numero, cor, data_criado, data_atualizado, numero_sistema
        FROM etapas
        ORDER BY numero ASC
      `);
      
      console.log("Stages from local DB:", result);
      return (result.rows || []) as Stage[];
    }
  } catch (error) {
    console.error("Error fetching stages:", error);
    toast.error("Erro ao carregar etapas");
    return [];
  }
};

export const getStageById = async (id: string): Promise<Stage | undefined> => {
  try {
    const result = await query(
      `SELECT id, nome, numero, cor, data_criado, data_atualizado, numero_sistema
       FROM etapas 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return result.rows[0] as Stage;
  } catch (error) {
    console.error("Error fetching stage:", error);
    toast.error("Erro ao carregar etapa");
    return undefined;
  }
};

export const createStage = async (stage: Omit<Stage, "id" | "data_criado" | "data_atualizado">): Promise<Stage> => {
  try {
    const result = await query(
      `INSERT INTO etapas (
         nome, numero, cor, numero_sistema
       ) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [
        stage.nome,
        stage.numero,
        stage.cor,
        stage.numeroSistema || null
      ]
    );

    toast.success("Etapa criada com sucesso");
    return result.rows[0] as Stage;
  } catch (error) {
    console.error("Error creating stage:", error);
    toast.error("Erro ao criar etapa");
    throw error;
  }
};

export const updateStage = async (id: string, updates: Partial<Stage>): Promise<Stage> => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        // Adjust property name for database column if needed
        const dbKey = key === 'numeroSistema' ? 'numero_sistema' : key;
        fields.push(`${dbKey} = $${paramCounter++}`);
        values.push(value);
      }
    });
    
    fields.push(`data_atualizado = NOW()`);
    values.push(id);
    
    const result = await query(
      `UPDATE etapas 
       SET ${fields.join(', ')} 
       WHERE id = $${paramCounter} 
       RETURNING *`,
      values
    );

    toast.success("Etapa atualizada com sucesso");
    return result.rows[0] as Stage;
  } catch (error) {
    console.error("Error updating stage:", error);
    toast.error("Erro ao atualizar etapa");
    throw error;
  }
};

export const deleteStage = async (id: string): Promise<void> => {
  try {
    await query(
      "DELETE FROM etapas WHERE id = $1",
      [id]
    );

    toast.success("Etapa excluída com sucesso");
  } catch (error) {
    console.error("Error deleting stage:", error);
    toast.error("Erro ao excluir etapa");
    throw error;
  }
};
