
import { getAudioInstance, setAudioInstance, unlockAudio, canPlayAudio } from './soundCore';
import { initAudioContext } from './audioContext';
import { setLastPlayedAudio, cleanupLastPlayedAudio } from './soundStateManager';
import { getAudio } from './soundResources';

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
    
    // Use the getAudio helper to get a proper Audio instance
    const newAudio = getAudio(soundType);
    
    // CRITICAL FIX: Ensure volume is exactly as requested without any modification
    // For notification sounds, this should be 1.0 (100%)
    const exactVolume = Math.max(0, Math.min(1, volume)); // Ensure volume is between 0 and 1
    newAudio.volume = exactVolume;
    console.log(`🔊 Audio volume explicitly set to: ${newAudio.volume} (from requested: ${volume})`);
    
    newAudio.loop = loop;
    
    // Set attributes for better mobile compatibility
    newAudio.setAttribute('playsinline', 'true');
    newAudio.setAttribute('preload', 'auto');
    
    // Debug audio element properties to ensure it's correctly configured
    console.log(`Audio element properties:`, {
      src: newAudio.src,
      volume: newAudio.volume,
      loop: newAudio.loop,
      paused: newAudio.paused,
      muted: newAudio.muted,
      autoplay: newAudio.autoplay,
      preload: newAudio.preload
    });
    
    // Add event listeners to track success/failure
    newAudio.addEventListener('playing', () => {
      console.log(`✅ Sound '${soundType}' started playing successfully with volume ${newAudio.volume}`);
      
      // Double-check the volume is correct after playing starts
      if (newAudio.volume !== exactVolume) {
        console.warn(`⚠️ Volume changed after play started. Forcing back to ${exactVolume}`);
        newAudio.volume = exactVolume;
      }
    });
    
    newAudio.addEventListener('error', (e) => {
      console.error(`❌ Error playing sound '${soundType}':`, e);
      console.error(`Audio error code: ${newAudio.error?.code}, message: ${newAudio.error?.message}`);
    });
    
    // Add canplaythrough listener to know when audio is ready to play
    newAudio.addEventListener('canplaythrough', () => {
      console.log(`🎵 Sound '${soundType}' is ready to play`);
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
        console.log(`✅ Sound '${soundType}' play promise resolved successfully with volume ${newAudio.volume}`);
        
        // Ensure volume is still correct after promise resolves
        if (newAudio.volume !== exactVolume) {
          console.warn(`⚠️ Volume changed after promise. Forcing back to ${exactVolume}`);
          newAudio.volume = exactVolume;
        }
        
        return true;
      }).catch((error) => {
        console.error(`❌ Error playing sound '${soundType}':`, error);
        
        if (error.name === "NotAllowedError") {
          console.warn("⚠️ Audio playback was prevented by browser. User interaction is required first.");
          
          // Try to unlock audio after error and play again
          setTimeout(() => {
            console.log(`🔄 Retrying after NotAllowedError for ${soundType}`);
            unlockAudio();
            newAudio.volume = exactVolume; // Ensure volume is still correct
            newAudio.play().catch(e => {
              console.warn(`Retry play error for ${soundType}:`, e);
              return false;
            });
          }, 200);
        }
        
        return false;
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
