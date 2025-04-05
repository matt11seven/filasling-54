
import { useState, useEffect, useRef } from "react";
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load audio element on component mount
  useEffect(() => {
    // Create a direct audio element reference that we'll control manually
    const audio = new Audio("/sounds/notificacao.mp3");
    audio.preload = "auto";
    audio.volume = settings.soundVolume || 0.5;
    
    // Add logging for debug
    audio.oncanplay = () => console.log("✅ Notification audio loaded and ready to play");
    audio.onplay = () => console.log("✅ Notification audio started playing");
    audio.onerror = (e) => console.error("❌ Notification audio error:", e);
    
    // Save reference
    audioRef.current = audio;
    
    // Force load
    audio.load();
    
    console.log("Notification audio element created and prepared");
    
    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [settings.soundVolume]);

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
          console.log('AUDIO SYSTEM STATUS WHEN TICKET ARRIVES:', debugAudioSystems());
          
          // Try to play sound with multiple approaches for maximum compatibility
          
          // APPROACH 1: Use our direct audio reference (most reliable)
          try {
            if (audioRef.current) {
              console.log("APPROACH 1: Playing with direct audio reference");
              // Reset playback position first to ensure it plays even if it was played before
              audioRef.current.currentTime = 0;
              audioRef.current.volume = settings.soundVolume || 0.5;
              
              const playPromise = audioRef.current.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => console.log("✅ Direct audio reference play succeeded"))
                  .catch(err => {
                    console.error("❌ Direct audio reference play failed:", err);
                    // Try alternate methods if this one fails
                    tryAlternateSoundMethods();
                  });
              }
            } else {
              console.log("❌ Audio reference is not available, trying alternate methods");
              tryAlternateSoundMethods();
            }
          } catch (error) {
            console.error("❌ Error with direct audio playback:", error);
            tryAlternateSoundMethods();
          }
          
          // Show toast notification
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

    // Helper function to try alternative sound playback methods
    const tryAlternateSoundMethods = () => {
      // APPROACH 2: Try using the notificationService methods
      console.log("APPROACH 2: Using playSoundByEventType");
      const notificationSound = settings.notificationSound || "notificacao";
      
      // First make sure audio is unlocked
      unlockAudio();
      
      // Try the higher level function
      const result = playSoundByEventType('notification', settings, undefined, false);
      console.log(`playSoundByEventType result: ${result ? 'SUCCESS' : 'FAILED'}`);
      
      // APPROACH 3: Create a brand new audio element and play
      if (!result) {
        console.log("APPROACH 3: Creating fresh Audio object");
        try {
          const freshAudio = new Audio(`/sounds/${notificationSound}.mp3`);
          freshAudio.volume = settings.soundVolume || 0.5;
          
          // Force loading before play
          freshAudio.load();
          
          const freshPlayPromise = freshAudio.play();
          if (freshPlayPromise !== undefined) {
            freshPlayPromise
              .then(() => console.log("✅ Fresh audio play succeeded"))
              .catch(err => console.error("❌ Fresh audio play failed:", err));
          }
        } catch (error) {
          console.error("❌ Error creating fresh audio:", error);
        }
      }
    };

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
