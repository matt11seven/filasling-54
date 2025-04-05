
import { getAudioInstance, setAudioInstance, unlockAudio, canPlayAudio } from './soundCore';
import { initAudioContext } from './audioContext';
import { setLastPlayedAudio, cleanupLastPlayedAudio } from './soundStateManager';

// Access the verbose debug setting from environment variables
const VERBOSE = typeof VERBOSE_DEBUG !== 'undefined' ? VERBOSE_DEBUG : false

export const playSound = (soundType: string = "notification", volume: number = 0.5, loop: boolean = false): boolean => {
  try {
    console.log(`▶️ DIRECT PLAY ATTEMPT: "${soundType}", volume: ${volume}, loop: ${loop}`);
    
    if (VERBOSE) {
      console.log("🔍 VERBOSE: Audio environment:", {
        userAgent: navigator.userAgent,
        hasFocus: document.hasFocus(),
        isVisible: !document.hidden,
        hasAudioAPI: typeof Audio !== 'undefined',
        hasAudioContext: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
      });
    }
    
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
    
    if (VERBOSE) {
      // Check if file exists by sending a HEAD request
      fetch(audioPath, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            console.log(`🔍 VERBOSE: Audio file ${audioPath} exists and is accessible`);
          } else {
            console.error(`🔍 VERBOSE: Audio file ${audioPath} not found or inaccessible (status ${response.status})`);
          }
        })
        .catch(error => {
          console.error(`🔍 VERBOSE: Error checking audio file ${audioPath}:`, error);
        });
    }
    
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
      const errorCode = newAudio.error ? newAudio.error.code : 'unknown';
      const errorMessage = newAudio.error ? newAudio.error.message : 'unknown error';
      console.error(`❌ Error playing sound '${soundType}': code=${errorCode}, message=${errorMessage}`, e);
    });
    
    if (VERBOSE) {
      // Add more detailed event listeners for debugging
      newAudio.addEventListener('canplay', () => {
        console.log(`🔍 VERBOSE: Sound '${soundType}' can play`);
      });
      
      newAudio.addEventListener('canplaythrough', () => {
        console.log(`🔍 VERBOSE: Sound '${soundType}' can play through`);
      });
      
      newAudio.addEventListener('waiting', () => {
        console.log(`🔍 VERBOSE: Sound '${soundType}' is waiting for data`);
      });
      
      newAudio.addEventListener('stalled', () => {
        console.log(`🔍 VERBOSE: Sound '${soundType}' playback is stalled`);
      });
    }
    
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
        
        if (VERBOSE) {
          console.log(`🔍 VERBOSE: Error details for ${soundType}:`, {
            errorName: error.name,
            errorMessage: error.message,
            audioElement: {
              src: newAudio.src,
              volume: newAudio.volume,
              muted: newAudio.muted,
              paused: newAudio.paused,
              readyState: newAudio.readyState,
              networkState: newAudio.networkState,
              ended: newAudio.ended,
              duration: newAudio.duration,
              currentTime: newAudio.currentTime
            }
          });
        }
        
        if (error.name === "NotAllowedError") {
          console.warn("⚠️ Audio playback was prevented by browser. User interaction is required first.");
          
          // Try to unlock audio after error and play again
          setTimeout(() => {
            unlockAudio();
            newAudio.play().catch(e => {
              console.warn(`Retry play error for ${soundType}:`, e);
              
              // Try one more time with user interaction simulation
              if (VERBOSE) {
                console.log("🔍 VERBOSE: Attempting to simulate user interaction for audio playback");
              }
              
              // Try to create and use an AudioContext as a backup approach
              try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                  const audioCtx = new AudioContextClass();
                  const source = audioCtx.createBufferSource();
                  source.connect(audioCtx.destination);
                  source.start(0);
                  
                  setTimeout(() => {
                    newAudio.play().catch(finalError => {
                      console.error(`Final play attempt failed for ${soundType}:`, finalError);
                    });
                  }, 100);
                }
              } catch (audioCtxError) {
                console.error("Failed to create AudioContext:", audioCtxError);
              }
            });
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
