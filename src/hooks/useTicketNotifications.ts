
import { useState, useEffect } from "react";
import { Ticket } from "@/types";
import { useSettings } from "@/contexts/SettingsContext";
import { 
  stopAlertNotification,
  startAlertNotification,
  unlockAudio,
  playSound
} from "@/services/notificationService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Import sonner first to ensure proper type augmentation
import "sonner";

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
    console.log('📢 DEBUG: Current notification sound setting:', settings.notificationSound);
    
    // Immediately unlock audio to prepare for potential sounds
    unlockAudio();
    
    // Teste de reprodução do som no início (apenas para depuração)
    console.log('🔊 Testing sound system with a silent test');
    playSound('beep', 0.01, false);  // Volume muito baixo, quase inaudível
    
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
          console.log('🛎️ DEBUG: About to create toast notification for new ticket');
          
          // Fixed: Use a custom id to identify this toast in the Toaster component
          toast.info('Novo atendimento na fila!', {
            duration: 5000,
            important: true,
            id: 'new-ticket-notification' // Use id instead of data property
          });
          
          console.log('🚨 DEBUG: Created toast with id "new-ticket-notification"');
          
          // Try multiple sound options to ensure one works
          unlockAudio();
          
          // Primeiro tenta com a configuração do usuário
          console.log(`🔈 Attempting to play primary notification sound: "${settings.notificationSound}"`);
          let success = playSound(settings.notificationSound, 1.0, false);
          
          // Se falhar, tenta com um som fixo
          if (!success) {
            console.log("⚠️ Primary sound failed, trying with fixed sound 'notificacao'");
            success = playSound('notificacao', 1.0, false);
            
            // Se ainda falhar, tenta com 'beep'
            if (!success) {
              console.log("⚠️ Second attempt failed, trying with 'beep'");
              success = playSound('beep', 1.0, false);
            }
          }
          
          // Backup: Tenta novamente após um curto atraso
          setTimeout(() => {
            console.log("🕒 Delayed backup sound attempt");
            unlockAudio();
            playSound('beep', 1.0, false);
          }, 500);
          
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
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to ticket events!');
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Subscription timed out!');
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
