
import { supabase } from "@/integrations/supabase/client";

// Configure channel for realtime updates
export const subscribeToTickets = (callback: () => void) => {
  console.log("Setting up realtime subscription for tickets");
  
  // This channel will track all changes in the tickets table (inserts, updates and removals)
  const channel = supabase
    .channel('public:tickets')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'tickets' 
      }, 
      (payload) => {
        console.log('New ticket detected!', payload);
        callback();
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
        callback();
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
        callback();
      }
    )
    .subscribe();
    
  // Return the channel so it can be cleaned up when needed
  return channel;
};
