
import { useState, useEffect } from "react";
import { Ticket } from "@/types";
import { useSettings } from "@/contexts/SettingsContext";
import { 
  stopAlertNotification,
  unlockAudio
} from "@/services/notificationService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Access the verbose debug setting from environment variables
const VERBOSE = typeof VERBOSE_DEBUG !== 'undefined' ? VERBOSE_DEBUG : false;

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
    
    if (VERBOSE) {
      console.log("🔍 VERBOSE: Initial subscription status:", {
        ticketsCount: tickets.length,
        alertActive,
        settings
      });
    }
    
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
          
          if (VERBOSE) {
            console.log("🔍 VERBOSE: Document state at notification time:", {
              hasFocus: document.hasFocus(),
              isVisible: !document.hidden,
              activeElement: document.activeElement?.tagName,
              readyState: document.readyState
            });
          }
          
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
        () => {
          onTicketChange();
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          onTicketChange();
        }
      )
      .subscribe((status) => {
        console.log(`Supabase channel status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to ticket events!');
          
          if (VERBOSE) {
            console.log("🔍 VERBOSE: Subscription complete, audio state:", {
              audioElement: typeof Audio !== 'undefined',
              audioContext: typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined',
              notificationAPI: typeof Notification !== 'undefined',
              notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'undefined'
            });
          }
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
