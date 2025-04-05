
import { useState, useEffect, useRef } from "react";
import { Ticket } from "@/types";
import { useSettings } from "@/contexts/SettingsContext";
import { 
  startAlertNotification,
  stopAlertNotification,
  unlockAudio,
  debugAudioSystems
} from "@/services/notificationService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useTicketNotifications = (
  tickets: Ticket[],
  onTicketChange: () => void
) => {
  const { settings } = useSettings();
  const [alertActive, setAlertActive] = useState(false);

  // Check if we need to manage alert states
  useEffect(() => {
    const pendingTickets = tickets.filter(ticket => ticket.etapa_numero === 1);
    
    if (pendingTickets.length > 0 && !alertActive) {
      // Unlock audio first
      unlockAudio();
      
      // Don't start alert sound here - only when the user sees the alert popup
      console.log("✅ Pending tickets detected, but alert sound will be played when popup is shown");
      setAlertActive(true);
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

  // Set up realtime subscription for tickets table
  useEffect(() => {
    console.log('Setting up realtime subscription for tickets...');
    
    // Immediately unlock audio to prepare for potential sounds
    unlockAudio();
    
    // Check audio system state before setting up subscription
    console.log("AUDIO SYSTEM STATUS BEFORE SUBSCRIPTION:", debugAudioSystems());
    
    const channel = supabase
      .channel('public:tickets')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'tickets' 
        }, 
        (payload) => {
          console.log('🔔 New ticket detected! Payload:', payload);
          
          // Show toast notification - the sound will be played by the Toaster component
          toast.info('Novo atendimento na fila!');
          
          // Update the ticket list
          onTicketChange();
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          console.log('Ticket updated!', payload);
          onTicketChange();
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          console.log('Ticket removed!', payload);
          onTicketChange();
        }
      )
      .subscribe((status) => {
        console.log(`Supabase channel status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to ticket events!');
        }
      });
    
    console.log('Realtime subscription for tickets started');

    // Cleanup: unsubscribe on component unmount
    return () => {
      console.log('Deactivating realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [onTicketChange, settings]);

  return {
    alertActive
  };
};
