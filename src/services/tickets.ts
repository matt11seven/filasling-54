
import { Ticket } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const getTickets = async (): Promise<Ticket[]> => {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("data_criado", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error("Error in getTickets:", error);
    toast.error("Erro ao carregar chamados");
    return [];
  }
};

export const getTicketById = async (id: string): Promise<Ticket | undefined> => {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching ticket:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Error in getTicketById:", error);
    toast.error("Erro ao carregar chamado");
    return undefined;
  }
};

export const createTicket = async (ticket: Omit<Ticket, "id" | "data_criado" | "data_atualizado">): Promise<Ticket> => {
  try {
    // Auto-set the stage to 1 (Aguardando) if not specified
    if (!ticket.etapa_numero) {
      ticket.etapa_numero = 1;
    }
    
    // Ensure that email_atendente is provided as it's required by the database
    if (!ticket.email_atendente) {
      throw new Error("Email do atendente é obrigatório");
    }
    
    const { data, error } = await supabase
      .from("tickets")
      .insert(ticket)
      .select()
      .single();

    if (error) {
      console.error("Error creating ticket:", error);
      throw new Error(error.message);
    }

    toast.success("Chamado criado com sucesso");
    return data;
  } catch (error) {
    console.error("Error in createTicket:", error);
    toast.error("Erro ao criar chamado");
    throw error;
  }
};

export const updateTicket = async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating ticket:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Error in updateTicket:", error);
    toast.error("Erro ao atualizar chamado");
    throw error;
  }
};

export const deleteTicket = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("tickets")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting ticket:", error);
      throw new Error(error.message);
    }

    toast.success("Chamado excluído com sucesso");
  } catch (error) {
    console.error("Error in deleteTicket:", error);
    toast.error("Erro ao excluir chamado");
    throw error;
  }
};
