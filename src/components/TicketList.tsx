
import { useState } from "react";
import { Ticket, Stage } from "@/types";
import { updateTicket } from "@/services";
import { toast } from "sonner";
import { useAudioSetup } from "@/hooks/useAudioSetup";
import { useTicketNotifications } from "@/hooks/useTicketNotifications";
import TicketCardRow from "./ticket/TicketCardRow";

interface TicketListProps {
  tickets: Ticket[];
  stages: Stage[];
  onTicketChange: () => void;
}

const TicketList = ({ tickets, stages, onTicketChange }: TicketListProps) => {
  // Initialize audio system
  useAudioSetup();
  
  // Setup notification and alert system
  useTicketNotifications(tickets, onTicketChange);

  // Update ticket status
  const handleStatusChange = async (ticketId: string, newStageNumber: number) => {
    try {
      await updateTicket(ticketId, { etapa_numero: newStageNumber });
      toast.success("Ticket status updated successfully");
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Error updating ticket status");
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tickets.map((ticket) => (
        <TicketCardRow
          key={ticket.id}
          ticket={ticket}
          stages={stages}
          onStatusChange={handleStatusChange}
        />
      ))}
      
      {tickets.length === 0 && (
        <div className="col-span-full text-center p-12">
          <p className="text-muted-foreground">No tickets found</p>
        </div>
      )}
    </div>
  );
};

export default TicketList;
