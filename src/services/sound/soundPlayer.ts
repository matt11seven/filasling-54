import { getAudio } from './soundResources';
import { getAudioInstance, setAudioInstance, unlockAudio, canPlayAudio } from './soundCore';

let notificationInterval: NodeJS.Timeout | null = null;
let lastPlayedAudio: HTMLAudioElement | null = null;
let audioContext: AudioContext | null = null;

// Initialize Web Audio API for better background playback support
const initAudioContext = () => {
  if (!audioContext) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
        console.log("AudioContext initialized for better background playback");
      }
    } catch (error) {
      console.warn("Failed to create AudioContext:", error);
    }
  }
  return audioContext;
};

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
    
    // Get the audio instance - always create a fresh instance for reliable playback
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
    lastPlayedAudio = newAudio;
    
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
  if (lastPlayedAudio && lastPlayedAudio !== audio) {
    try {
      lastPlayedAudio.pause();
      lastPlayedAudio.currentTime = 0;
      lastPlayedAudio = null;
    } catch (error) {
      console.error("❌ Error stopping last played sound:", error);
    }
  }
  
  return false;
};

// Set up a repeating notification
export const startAlertNotification = (soundType: string, volume: number, intervalSeconds: number = 10) => {
  // Stop any existing alert first
  stopAlertNotification();
  
  // If sound type is "none", don't play anything
  if (soundType === "none") {
    console.log("Alert sound type is 'none', not starting notification");
    return true;
  }
  
  // First play immediately
  const success = playSound(soundType, volume, false);
  
  // Request notification permission if needed for background alerts
  if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      console.log(`Notification permission: ${permission}`);
    });
  }
  
  // Then set up interval only if first play was successful
  if (success) {
    // Setup visibility change handler for minimized window
    const handleVisibilityChange = () => {
      if (document.hidden && notificationInterval) {
        // When tab becomes hidden, play sound immediately to ensure it starts in background
        playSound(soundType, volume, false);
      }
    };
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    notificationInterval = setInterval(() => {
      playSound(soundType, volume, false);
    }, intervalSeconds * 1000);
    
    console.log(`🔔 Started alert notification with sound: ${soundType}, volume: ${volume}, interval: ${intervalSeconds}s`);
    return true;
  }
  
  return false;
};

export const stopAlertNotification = () => {
  stopSound();
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
    // Remove visibility change handler
    document.removeEventListener('visibilitychange', () => {});
    console.log("🔕 Alert notification stopped");
    return true;
  }
  return false;
};

// Check current notification state
export const isNotificationActive = (): boolean => {
  return notificationInterval !== null;
};
