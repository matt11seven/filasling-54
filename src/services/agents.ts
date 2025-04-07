
import { Agent } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const getAgents = async (): Promise<Agent[]> => {
  try {
    const { data, error } = await supabase
      .from("atendentes")
      .select("*");

    if (error) {
      console.error("Error fetching agents:", error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAgents:", error);
    toast.error("Erro ao carregar atendentes");
    return [];
  }
};

export const getAgentById = async (id: string): Promise<Agent | undefined> => {
  try {
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
  } catch (error) {
    console.error("Error in getAgentById:", error);
    toast.error("Erro ao carregar atendente");
    return undefined;
  }
};

export const getAgentByEmail = async (email: string): Promise<Agent | undefined> => {
  try {
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
  } catch (error) {
    console.error("Error in getAgentByEmail:", error);
    return undefined;
  }
};

export const createAgent = async (agent: Omit<Agent, "id" | "data_criado" | "data_atualizado">): Promise<Agent> => {
  try {
    const { data, error } = await supabase
      .from("atendentes")
      .insert(agent)
      .select()
      .single();

    if (error) {
      console.error("Error creating agent:", error);
      throw new Error(error.message);
    }

    toast.success("Atendente criado com sucesso");
    return data;
  } catch (error) {
    console.error("Error in createAgent:", error);
    toast.error("Erro ao criar atendente");
    throw error;
  }
};

export const updateAgent = async (id: string, updates: Partial<Agent>): Promise<Agent> => {
  try {
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
  } catch (error) {
    console.error("Error in updateAgent:", error);
    toast.error("Erro ao atualizar atendente");
    throw error;
  }
};

export const deleteAgent = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("atendentes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting agent:", error);
      throw new Error(error.message);
    }

    toast.success("Atendente excluído com sucesso");
  } catch (error) {
    console.error("Error in deleteAgent:", error);
    toast.error("Erro ao excluir atendente");
    throw error;
  }
};
