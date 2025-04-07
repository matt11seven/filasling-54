
import { useState, useEffect } from "react";
import { Ticket } from "@/types";
import { useSettings } from "@/contexts/SettingsContext";
import { 
  stopAlertNotification,
  startAlertNotification,
  unlockAudio,
  playSound
} from "@/services/notificationService";
import { setupTicketNotifications, setupTicketStatusChanges } from "@/services/notificationSystem";
import { toast } from "sonner";

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

  // Set up notifications for new tickets and status changes
  useEffect(() => {
    console.log('Setting up notifications for tickets...');
    console.log('📢 DEBUG: Current notification sound setting:', settings.notificationSound);
    
    // Immediately unlock audio to prepare for potential sounds
    unlockAudio();
    
    // Test sound system with a very quiet beep
    console.log('🔊 Testing sound system with a silent test');
    playSound('beep', 0.01, false);
    
    // Setup notification system for new tickets
    const ticketNotificationCleanup = setupTicketNotifications(onTicketChange);
    
    // Setup notification system for ticket status changes
    const statusChangeCleanup = setupTicketStatusChanges(onTicketChange);
    
    console.log('Notification systems started');

    // Cleanup both systems on component unmount
    return () => {
      console.log('Deactivating notification systems');
      ticketNotificationCleanup();
      statusChangeCleanup();
    };
  }, [onTicketChange, settings]);

  return {
    alertActive
  };
};
