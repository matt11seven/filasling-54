
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
    
    // Check if user has interacted
    if (!canPlayAudio()) {
      console.warn("Cannot play audio yet - waiting for user interaction");
      return false;
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
    
    newAudio.addEventListener('canplay', () => {
      console.log(`✅ Sound '${soundType}' can play now`);
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
      
      // Play with standard HTML5 Audio
      const playPromise = newAudio.play();
      
      if (playPromise !== undefined) {
        console.log("Play promise exists, waiting for resolution...");
        playPromise.then(() => {
          console.log(`✅ Sound '${soundType}' play promise resolved successfully`);
          return true;
        }).catch((error) => {
          console.error(`❌ Error playing sound '${soundType}':`, error);
          if (error.name === "NotAllowedError") {
            console.warn("⚠️ Audio playback was prevented by browser. User interaction is required first.");
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
