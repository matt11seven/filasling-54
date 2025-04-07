
import { Ticket } from "@/types";
import { query } from "@/integrations/postgres/client";
import { toast } from "sonner";
import { playSound, unlockAudio } from "@/services/notificationService";

// Setup notification event listeners
export const setupTicketNotifications = (callback: () => void) => {
  // Unfortunately we can't use Supabase realtime, so we'll use polling instead
  const interval = setInterval(async () => {
    try {
      const result = await query(`
        SELECT id, nome, motivo
        FROM tickets
        WHERE data_criado > NOW() - INTERVAL '30 seconds'
        ORDER BY data_criado DESC
        LIMIT 1
      `);
      
      if (result.rows.length > 0) {
        // Get the latest ticket
        const latestTicket = result.rows[0];
        
        // Get the last notification ID from localStorage
        const lastNotifiedId = localStorage.getItem('lastNotifiedTicketId');
        
        // If this is a new ticket, notify
        if (lastNotifiedId !== latestTicket.id) {
          console.log('🔔 New ticket detected! Ticket:', latestTicket);
          
          // Play notification sound
          unlockAudio();
          playSound('notificacao', 1.0, false);
          
          // Show toast notification
          toast.info(`Novo atendimento: ${latestTicket.nome}`, {
            duration: 5000,
            important: true,
            id: `new-ticket-${latestTicket.id}`
          });
          
          // Save this ticket ID as the last notified
          localStorage.setItem('lastNotifiedTicketId', latestTicket.id);
          
          // Call the callback to update UI
          callback();
        }
      }
    } catch (error) {
      console.error('Error checking for new tickets:', error);
    }
  }, 5000); // Check every 5 seconds
  
  // Return a cleanup function
  return () => clearInterval(interval);
};

// Function to check for ticket status changes
export const setupTicketStatusChanges = (callback: () => void) => {
  const interval = setInterval(async () => {
    try {
      // Track ticket status changes (from localStorage)
      const trackedTickets = JSON.parse(localStorage.getItem('trackedTickets') || '{}');
      
      // If we have tickets to track, check their status
      if (Object.keys(trackedTickets).length > 0) {
        // Get the current status of all tracked tickets
        const ids = Object.keys(trackedTickets);
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
        
        const result = await query(`
          SELECT id, etapa_numero
          FROM tickets
          WHERE id IN (${placeholders})
        `, ids);
        
        // Check for status changes
        let hasChanges = false;
        
        result.rows.forEach(ticket => {
          if (trackedTickets[ticket.id] !== ticket.etapa_numero) {
            hasChanges = true;
            trackedTickets[ticket.id] = ticket.etapa_numero;
          }
        });
        
        // If we found changes, update the UI
        if (hasChanges) {
          localStorage.setItem('trackedTickets', JSON.stringify(trackedTickets));
          callback();
        }
      }
    } catch (error) {
      console.error('Error checking for ticket status changes:', error);
    }
  }, 10000); // Check every 10 seconds
  
  // Return a cleanup function
  return () => clearInterval(interval);
};

// Track a ticket for status changes
export const trackTicket = (ticket: Ticket) => {
  const trackedTickets = JSON.parse(localStorage.getItem('trackedTickets') || '{}');
  trackedTickets[ticket.id] = ticket.etapa_numero;
  localStorage.setItem('trackedTickets', JSON.stringify(trackedTickets));
};

// Stop tracking a ticket
export const untrackTicket = (ticketId: string) => {
  const trackedTickets = JSON.parse(localStorage.getItem('trackedTickets') || '{}');
  delete trackedTickets[ticketId];
  localStorage.setItem('trackedTickets', JSON.stringify(trackedTickets));
};
