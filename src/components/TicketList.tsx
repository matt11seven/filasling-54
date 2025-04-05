import { useState, useEffect } from "react";
import { Ticket, Stage } from "@/types";
import TicketCard from "./TicketCard";
import { updateTicket, subscribeToTickets } from "@/services";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { getTimeStatus } from "@/utils/timeUtils";
import { 
  startAlertNotification, 
  stopAlertNotification, 
  playSound, 
  unlockAudio, 
  debugAudioSystems,
  preloadSounds,
  playSoundByEventType,
  requestBackgroundAudioPermission
} from "@/services/notificationService";
import { supabase } from "@/integrations/supabase/client";

interface TicketListProps {
  tickets: Ticket[];
  stages: Stage[];
  onTicketChange: () => void;
}

const TicketList = ({ tickets, stages, onTicketChange }: TicketListProps) => {
  const { settings } = useSettings();
  const [alertActive, setAlertActive] = useState(false);
  
  // Initialize audio context on first render and preload sounds
  useEffect(() => {
    console.log("TicketList mounted, initializing audio systems...");
    
    // Attempt to unlock audio early
    unlockAudio();
    
    // Debug audio state
    console.log("Initial audio state:", debugAudioSystems());
    
    // Request background audio permissions
    requestBackgroundAudioPermission().then(granted => {
      if (granted) {
        console.log("✅ Background audio permissions granted");
      } else {
        console.log("⚠️ Some background audio permissions may not be granted");
      }
    });
    
    // Initialize handler for user interaction to unlock audio
    const handleUserInteraction = () => {
      console.log("User interaction detected in TicketList");
      
      // Unlock audio
      const unlocked = unlockAudio();
      
      // Preload sounds
      preloadSounds();
      
      // Play a test sound with very low volume to ensure the audio context is running
      const testAudio = new Audio();
      testAudio.volume = 0.01; // Almost silent
      testAudio.play().catch(e => console.log("Silent test audio play failed:", e));
      
      // Debug current state
      console.log("After interaction audio state:", debugAudioSystems());
      
      // Remove handlers after first interaction
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };
    
    // Add interaction listeners
    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);
    
    // Setup visibility change listener to ensure audio works in background
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Page hidden, ensuring audio context is running");
        unlockAudio();
        // If there are pending tickets and alert should be active, restart it
        const pendingTickets = tickets.filter(ticket => ticket.etapa_numero === 1);
        if (pendingTickets.length > 0 && !alertActive) {
          startAlertNotification(settings.alertSound, settings.soundVolume);
          setAlertActive(true);
        }
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Cleanup function
    return () => {
      stopAlertNotification();
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Set up realtime subscription for tickets table
  useEffect(() => {
    console.log('Configurando inscrição em tempo real para os tickets...');
    
    // Use the subscribeToTickets function from dataService
    const handleTicketChange = () => {
      console.log('Alteração detectada nos tickets - atualizando lista...');
      onTicketChange();
      // Play notification sound for new/updated tickets using the new function
      playSoundByEventType('notification', settings);
      toast.info('Atualização de tickets recebida!');
    };
    
    const channel = subscribeToTickets(handleTicketChange);
    
    console.log('Inscrição em tempo real dos tickets iniciada');

    // Cleanup: unsubscribe on component unmount
    return () => {
      console.log('Desativando inscrição em tempo real');
      supabase.removeChannel(channel);
    };
  }, [onTicketChange, settings]);
  
  // Check if we need to play alert sounds
  useEffect(() => {
    const pendingTickets = tickets.filter(ticket => ticket.etapa_numero === 1);
    
    if (pendingTickets.length > 0 && !alertActive) {
      console.log("Pending tickets found, attempting to start alert notification");
      
      // Unlock audio first
      unlockAudio();
      
      // Start alert sound using the alert sound setting
      const success = startAlertNotification(settings.alertSound, settings.soundVolume);
      
      if (success) {
        console.log("✅ Alert notification started successfully");
        setAlertActive(true);
      } else {
        console.warn("⚠️ Failed to start alert notification, audio may be blocked");
        // Try again with user interaction
        const retryWithInteraction = () => {
          unlockAudio();
          const retrySuccess = startAlertNotification(settings.alertSound, settings.soundVolume);
          if (retrySuccess) {
            setAlertActive(true);
            document.removeEventListener("click", retryWithInteraction);
          }
        };
        
        // Add temporary listener to retry on click
        document.addEventListener("click", retryWithInteraction, { once: true });
      }
    } else if (pendingTickets.length === 0 && alertActive) {
      // Stop alert sound
      stopAlertNotification();
      setAlertActive(false);
    }
    
    // Cleanup
    return () => {
      stopAlertNotification();
    };
  }, [tickets, alertActive, settings]);

  // Update ticket status
  const handleStatusChange = async (ticketId: string, newStageNumber: number) => {
    try {
      await updateTicket(ticketId, { etapa_numero: newStageNumber });
      
      // If moving from "Aguardando" to any other stage, stop alert sound
      if (newStageNumber !== 1 && alertActive) {
        const stillHasPending = tickets.some(
          ticket => ticket.id !== ticketId && ticket.etapa_numero === 1
        );
        
        if (!stillHasPending) {
          stopAlertNotification();
          setAlertActive(false);
        }
      }
      
      toast.success("Status do chamado atualizado com sucesso");
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Erro ao atualizar status do chamado");
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          stages={stages}
          onStatusChange={handleStatusChange}
        />
      ))}
      
      {tickets.length === 0 && (
        <div className="col-span-full text-center p-12">
          <p className="text-muted-foreground">Nenhum chamado encontrado</p>
        </div>
      )}
    </div>
  );
};

export default TicketList;
