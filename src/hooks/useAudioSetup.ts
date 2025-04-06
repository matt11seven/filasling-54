
import { useEffect } from "react";
import { 
  unlockAudio, 
  debugAudioSystems, 
  preloadSounds,
  requestBackgroundAudioPermission
} from "@/services/notificationService";

export const useAudioSetup = () => {
  // Initialize audio context on first render and preload sounds
  useEffect(() => {
    console.log("Initializing audio systems...");
    
    // Force unlock audio early
    unlockAudio();
    
    // Debug audio state
    console.log("Initial audio state:", debugAudioSystems());
    
    // Preload all sounds immediately
    preloadSounds();
    
    // Request background audio permissions
    requestBackgroundAudioPermission().then(granted => {
      if (granted) {
        console.log("✅ Background audio permissions granted");
      } else {
        console.log("⚠️ Some background audio permissions may not be granted");
        
        // Remove the permission toast that was here
      }
    });
    
    // Initialize handler for user interaction to unlock audio
    const handleUserInteraction = () => {
      console.log("User interaction detected - unlocking audio");
      
      // Unlock audio with force
      unlockAudio();
      
      // Preload sounds again to make sure they're cached
      preloadSounds();
      
      // Play a test sound with very low volume to ensure the audio context is running
      const testAudio = new Audio("/sounds/notificacao.mp3");
      testAudio.volume = 0.01; // Almost silent
      testAudio.play().catch(e => console.log("Silent test audio play failed:", e));
      
      // Debug current state after interaction
      console.log("After interaction audio state:", debugAudioSystems());
    };
    
    // Add interaction listeners with capture phase to ensure they run early
    document.addEventListener("click", handleUserInteraction, { capture: true });
    document.addEventListener("touchstart", handleUserInteraction, { capture: true });
    document.addEventListener("keydown", handleUserInteraction, { capture: true });
    
    // Setup visibility change listener to ensure audio works in background
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Page visible again, ensuring audio context is running");
        unlockAudio();
        preloadSounds();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Cleanup function
    return () => {
      document.removeEventListener("click", handleUserInteraction, { capture: true });
      document.removeEventListener("touchstart", handleUserInteraction, { capture: true });
      document.removeEventListener("keydown", handleUserInteraction, { capture: true });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
};
