
// Notification system using polling for browser compatibility

import { toast } from "sonner";
import { playSound } from "./notificationService";
import { getMockPerformanceData } from "./mockData";

// Polling intervals in milliseconds
const NEW_TICKET_POLLING_INTERVAL = 10000; // 10 seconds
const STATUS_CHANGE_POLLING_INTERVAL = 5000; // 5 seconds

// Setup notification system for new tickets
export const setupTicketNotifications = (onTicketChange: () => void) => {
  console.log("Setting up ticket notification system...");
  
  // In a real implementation, this would poll a server endpoint
  // or use WebSockets to get real-time notifications
  
  // For development/demo purposes, we'll simulate random notifications
  const intervalId = setInterval(() => {
    // 10% chance of a new ticket in development mode
    if (import.meta.env.DEV && Math.random() < 0.1) {
      console.log("🎟️ Simulating new ticket notification");
      toast.info("Novo chamado recebido!", {
        description: "Um novo chamado foi adicionado à fila."
      });
      
      // Play notification sound
      playSound("notification", 0.7);
      
      // Trigger refresh
      onTicketChange();
    }
  }, NEW_TICKET_POLLING_INTERVAL);

  // Return cleanup function
  return () => {
    console.log("Cleaning up ticket notification system");
    clearInterval(intervalId);
  };
};

// Setup notification system for ticket status changes
export const setupTicketStatusChanges = (onTicketChange: () => void) => {
  console.log("Setting up ticket status change notification system...");
  
  // For development/demo purposes, we'll simulate random status changes
  const intervalId = setInterval(() => {
    // 5% chance of a status change in development mode
    if (import.meta.env.DEV && Math.random() < 0.05) {
      const mockData = getMockPerformanceData();
      const randomAgent = mockData[Math.floor(Math.random() * mockData.length)];
      
      console.log("🔄 Simulating ticket status change");
      toast.success(`Chamado atualizado por ${randomAgent.nome}`, {
        description: "Um chamado foi movido para uma nova etapa."
      });
      
      // Play notification sound
      playSound("beep", 0.5);
      
      // Trigger refresh
      onTicketChange();
    }
  }, STATUS_CHANGE_POLLING_INTERVAL);

  // Return cleanup function
  return () => {
    console.log("Cleaning up status change notification system");
    clearInterval(intervalId);
  };
};
