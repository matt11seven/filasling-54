
import { Stage } from "@/types";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";

export const getStages = async (): Promise<Stage[]> => {
  try {
    const result = await query(
      `SELECT * FROM etapas 
       ORDER BY numero ASC`
    );

    return result.rows || [];
  } catch (error) {
    console.error("Error fetching stages:", error);
    toast.error("Erro ao carregar etapas");
    return [];
  }
};

export const updateStage = async (id: string, updates: Partial<Stage>): Promise<Stage> => {
  try {
    // Construct the SET part of the SQL query dynamically
    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    // Add each update field to the query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCounter++}`);
        values.push(value);
      }
    });
    
    // Add update timestamp
    fields.push(`data_atualizado = NOW()`);
    
    // Add the id to the values array
    values.push(id);
    
    // Execute the update query
    const result = await query(
      `UPDATE etapas 
       SET ${fields.join(', ')} 
       WHERE id = $${paramCounter} 
       RETURNING *`,
      values
    );

    toast.success("Etapa atualizada com sucesso");
    return result.rows[0];
  } catch (error) {
    console.error("Error updating stage:", error);
    toast.error("Erro ao atualizar etapa");
    throw error;
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
        stage.numeroSistema
      ]
    );

    toast.success("Etapa criada com sucesso");
    return result.rows[0];
  } catch (error) {
    console.error("Error creating stage:", error);
    toast.error("Erro ao criar etapa");
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
