
import { useState, useEffect } from "react";
import { Ticket } from "@/types";
import { useSettings } from "@/contexts/SettingsContext";
import { 
  startAlertNotification,
  stopAlertNotification,
  unlockAudio,
  playSoundByEventType,
  playSound,
  getAudio,
  getAudioState,
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
    
    // Get the configured notification sound from settings
    const configuredNotificationSound = settings.notificationSound || "notificacao";
    console.log(`Using configured notification sound: ${configuredNotificationSound}`);
    
    // Force preload notification sound specifically
    console.log(`Pre-loading notification sound: ${configuredNotificationSound} to ensure immediate playback`);
    
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
          console.log('AUDIO SYSTEM STATUS WHEN TICKET ARRIVES:', debugAudioSystems());
          
          // Use the configured notification sound from settings
          const notificationSound = settings.notificationSound || "notificacao";
          console.log(`Playing configured notification sound: ${notificationSound}`);
          
          // First try unlocking audio again right before playing
          unlockAudio();
          
          // Check if we can play audio
          console.log(`Can play audio? ${getAudioState().userHasInteracted ? 'YES' : 'NO'}`);
          
          // Try both methods to ensure the sound plays
          console.log(`Attempt 1: Using playSound directly with ${notificationSound}`);
          const playResult1 = playSound(notificationSound, settings.soundVolume || 0.5, false);
          console.log(`playSound result: ${playResult1 ? 'SUCCESS' : 'FAILED'}`);
          
          // Also try the higher level method as backup
          console.log(`Attempt 2: Using playSoundByEventType with 'notification'`);
          const playResult2 = playSoundByEventType('notification', settings, undefined, false);
          console.log(`playSoundByEventType result: ${playResult2 ? 'SUCCESS' : 'FAILED'}`);
          
          // Try a third approach with a fresh audio instance
          try {
            console.log(`Attempt 3: Creating fresh audio instance for ${notificationSound}`);
            const audio = getAudio(notificationSound);
            audio.volume = settings.soundVolume || 0.5;
            audio.onplay = () => console.log("✅ Audio onplay event fired");
            audio.oncanplay = () => console.log("✅ Audio oncanplay event fired");
            audio.oncanplaythrough = () => console.log("✅ Audio oncanplaythrough event fired");
            audio.onerror = (e) => console.log("❌ Audio error event fired", e);
            
            // Force load before play
            audio.load();
            console.log("Audio loaded, attempting to play...");
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                console.log("✅ Direct Audio.play() Promise resolved successfully");
              }).catch(err => {
                console.error("❌ Direct Audio.play() Promise rejected:", err);
              });
            }
          } catch (error) {
            console.error("Failed in direct audio attempt:", error);
          }
          
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
