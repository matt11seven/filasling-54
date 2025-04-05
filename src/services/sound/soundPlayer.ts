
import { getAudioInstance, setAudioInstance, unlockAudio, canPlayAudio } from './soundCore';
import { initAudioContext } from './audioContext';
import { setLastPlayedAudio, cleanupLastPlayedAudio } from './soundStateManager';

export const playSound = (soundType: string = "notification", volume: number = 0.5, loop: boolean = false): boolean => {
  try {
    console.log(`▶️ DIRECT PLAY ATTEMPT: "${soundType}", volume: ${volume}, loop: ${loop}`);
    
    // Check if sound type is "none"
    if (soundType === "none") {
      console.log("Sound type is 'none', not playing any sound");
      return true;
    }
    
    // Force unlock audio first
    unlockAudio();
    
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
    
    // Set attributes for better mobile compatibility
    newAudio.setAttribute('playsinline', 'true');
    newAudio.setAttribute('preload', 'auto');
    
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
    
    // Initialize context if needed
    initAudioContext();
    
    // Use a Promise for better tracking
    const playPromise = newAudio.play();
    
    if (playPromise !== undefined) {
      console.log(`Play promise exists for ${soundType}, waiting for resolution...`);
      
      // Handle success/failure of the play attempt
      playPromise.then(() => {
        console.log(`✅ Sound '${soundType}' play promise resolved successfully`);
        return true;
      }).catch((error) => {
        console.error(`❌ Error playing sound '${soundType}':`, error);
        
        if (error.name === "NotAllowedError") {
          console.warn("⚠️ Audio playback was prevented by browser. User interaction is required first.");
          
          // Try to unlock audio after error and play again
          setTimeout(() => {
            unlockAudio();
            newAudio.play().catch(e => console.warn(`Retry play error for ${soundType}:`, e));
          }, 200);
        }
      });
    }
    
    return true;
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
