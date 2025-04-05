
import { supabase } from "@/integrations/supabase/client";

// This file is kept for backward compatibility
// The active subscription is now done directly in useTicketNotifications.ts

export const subscribeToTickets = (callback: () => void) => {
  console.log("DEPRECATED: subscribeToTickets is now handled in useTicketNotifications.ts");
  console.log("This function will be removed in a future update");
  
  // Return a dummy channel object with a subscribe method that does nothing
  return {
    subscribe: () => {
      console.warn("This is a dummy subscription. Please use useTicketNotifications instead");
      return null;
    },
    unsubscribe: () => {}
  };
};
