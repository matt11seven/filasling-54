
import { getAudioInstance, setAudioInstance, unlockAudio, canPlayAudio } from './soundCore';
import { initAudioContext } from './audioContext';
import { setLastPlayedAudio, cleanupLastPlayedAudio } from './soundStateManager';

export const playSound = (soundType: string = "notification", volume: number = 0.5, loop: boolean = false): boolean => {
  try {
    // Check if sound type is "none"
    if (soundType === "none") {
      console.log("Sound type is 'none', not playing any sound");
      return true;
    }
    
    // Check if user has interacted - always try to play anyway
    if (!canPlayAudio()) {
      console.warn("Cannot play audio yet - attempting to unlock audio system");
      unlockAudio();
    }
    
    console.log(`▶️ Attempting to play sound: "${soundType}", volume: ${volume}, loop: ${loop}`);
    
    // Get audio path - properly handle the sound type
    let audioPath = soundType;
    if (!soundType.includes('/')) {
      // If it's just a name without a path, assume it's in the sounds directory
      if (!soundType.endsWith('.mp3')) {
        audioPath = `/sounds/${soundType}.mp3`;
      } else {
        audioPath = `/sounds/${soundType}`;
      }
    }
    
    console.log(`Creating new audio for: ${audioPath}`);
    const newAudio = new Audio(audioPath);
    
    // Configure the audio
    newAudio.volume = Math.max(0, Math.min(1, volume)); // Ensure volume is between 0 and 1
    newAudio.loop = loop;
    
    // Try to unlock audio first (for iOS/Safari)
    unlockAudio();
    
    // Add event listeners to track success/failure
    newAudio.addEventListener('playing', () => {
      console.log(`✅ Sound '${soundType}' started playing successfully`);
    });
    
    newAudio.addEventListener('error', (e) => {
      console.error(`❌ Error playing sound '${soundType}':`, e);
    });
    
    // Force loading audio before playing
    newAudio.load();
    console.log(`Audio loaded for ${soundType}, attempting to play...`);
    
    // Store the instance
    setAudioInstance(newAudio);
    setLastPlayedAudio(newAudio);
    
    try {
      // Initialize context if needed
      initAudioContext();
      
      // Set a higher priority for this audio (can help with mobile devices)
      if ('mozAudioChannelType' in newAudio) {
        // @ts-ignore - Firefox-specific property
        newAudio.mozAudioChannelType = 'notification';
      }
      
      // Play with standard HTML5 Audio
      const playPromise = newAudio.play();
      
      if (playPromise !== undefined) {
        console.log("Play promise exists, waiting for resolution...");
        playPromise.then(() => {
          console.log(`✅ Sound '${soundType}' play promise resolved successfully`);
          
          // Try playing a second time for reliability on mobile
          if (newAudio.currentTime === 0) {
            console.log("Audio position is still 0, trying to play again...");
            newAudio.play().catch(e => console.warn("Second play attempt error:", e));
          }
          
          return true;
        }).catch((error) => {
          console.error(`❌ Error playing sound '${soundType}':`, error);
          if (error.name === "NotAllowedError") {
            console.warn("⚠️ Audio playback was prevented by browser. User interaction is required first.");
            
            // Try to unlock audio after error
            setTimeout(() => {
              unlockAudio();
              // Try again after a short delay
              setTimeout(() => {
                newAudio.play().catch(e => console.warn("Retry play error:", e));
              }, 500);
            }, 100);
            
            return false;
          }
        });
        return true;
      }
      
      console.log(`❓ Play promise was undefined for sound '${soundType}'`);
      return true;
    } catch (e) {
      console.error(`⚠️ Exception during play() call:`, e);
      return false;
    }
  } catch (error) {
    console.error("❌ Failed to play sound:", error);
    return false;
  }
};

export const stopSound = () => {
  const audio = getAudioInstance();
  if (audio) {
    try {
      audio.pause();
      audio.currentTime = 0;
      setAudioInstance(null);
      console.log("⏹ Sound stopped");
      return true;
    } catch (error) {
      console.error("❌ Error stopping sound:", error);
    }
  }
  
  // Also stop the last played audio
  cleanupLastPlayedAudio();
  
  return false;
};

// Re-export notification functions from notificationManager
export { 
  startAlertNotification,
  stopAlertNotification,
  isNotificationActive
} from './notificationManager';
