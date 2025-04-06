
import { useState, useEffect } from "react";
import { Ticket, Stage } from "@/types";
import { updateTicket } from "@/services";
import { toast } from "sonner";
import { useAudioSetup } from "@/hooks/useAudioSetup";
import { useTicketNotifications } from "@/hooks/useTicketNotifications";
import TicketCardRow from "./ticket/TicketCardRow";
import { unlockAudio, playSound } from "@/services/notificationService";

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

  // Ensure audio is ready on component mount
  useEffect(() => {
    // Unlock audio on mount to prepare for notifications
    unlockAudio();
    
    // Test sound system on mount but with zero volume
    // This helps "warm up" the audio system on browsers with strict autoplay policies
    const testAudio = new Audio("/sounds/notificacao.mp3");
    testAudio.volume = 0.01; // Almost silent
    testAudio.play().catch(e => {
      console.log("Silent test audio play attempted:", e);
      // If we get an error, we need user interaction
      // The AudioSetup hook will handle this
    });
    
    const handleVisibility = () => {
      if (!document.hidden) {
        // User returned to the tab, make sure audio is unlocked
        unlockAudio();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibility);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Update ticket status
  const handleStatusChange = async (ticketId: string, newStageNumber: number, systemNumber?: number) => {
    try {
      const updateData: Partial<Ticket> = { 
        etapa_numero: newStageNumber
      };
      
      // If systemNumber is provided, update that field as well
      if (systemNumber !== undefined) {
        updateData.numero_sistema = systemNumber;
      }
      
      await updateTicket(ticketId, updateData);
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
