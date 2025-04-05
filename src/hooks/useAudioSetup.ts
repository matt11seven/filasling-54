
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
    
    // Attempt to unlock audio early
    unlockAudio();
    
    // Debug audio state
    console.log("Initial audio state:", debugAudioSystems());
    
    // Request background audio permissions
    requestBackgroundAudioPermission().then(granted => {
      if (granted) {
        console.log("✅ Background audio permissions granted");
      } else {
        console.log("⚠️ Some background audio permissions may not be granted");
      }
    });
    
    // Initialize handler for user interaction to unlock audio
    const handleUserInteraction = () => {
      console.log("User interaction detected");
      
      // Unlock audio
      unlockAudio();
      
      // Preload sounds
      preloadSounds();
      
      // Play a test sound with very low volume to ensure the audio context is running
      const testAudio = new Audio();
      testAudio.volume = 0.01; // Almost silent
      testAudio.play().catch(e => console.log("Silent test audio play failed:", e));
      
      // Debug current state
      console.log("After interaction audio state:", debugAudioSystems());
      
      // Remove handlers after first interaction
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };
    
    // Add interaction listeners
    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);
    
    // Setup visibility change listener to ensure audio works in background
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Page hidden, ensuring audio context is running");
        unlockAudio();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Cleanup function
    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
};
