
import { useState, useMemo } from "react";
import { Ticket } from "@/types";

export const useTicketFilters = (tickets: Ticket[]) => {
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  
  // Apply all filters to tickets
  const filteredTickets = useMemo(() => {
    // Start with all tickets
    let filtered = [...tickets];

    // Filter by sector
    if (selectedSector !== "all") {
      filtered = filtered.filter((ticket) => ticket.setor === selectedSector);
    }
    
    // Filter by agent
    if (selectedAgent !== "all") {
      filtered = filtered.filter((ticket) => ticket.email_atendente === selectedAgent);
    }
    
    // Sort tickets
    return filtered.sort((a, b) => {
      const dateA = new Date(a.data_criado || a.data_criacao || '');
      const dateB = new Date(b.data_criado || b.data_criacao || '');
      return sortOrder === "desc" 
        ? dateB.getTime() - dateA.getTime() 
        : dateA.getTime() - dateB.getTime();
    });
  }, [tickets, selectedSector, selectedAgent, sortOrder]);
  
  const clearFilters = () => {
    setSelectedSector("all");
    setSelectedAgent("all");
    setSortOrder("desc");
  };
  
  return {
    filteredTickets,
    selectedSector,
    setSelectedSector,
    selectedAgent,
    setSelectedAgent,
    sortOrder,
    setSortOrder,
    clearFilters,
  };
};
