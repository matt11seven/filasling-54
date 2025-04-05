
// Core audio setup and initialization
let userHasInteracted = false;
let audioContext: AudioContext | null = null;
let audio: HTMLAudioElement | null = null;

// Detect if the browser supports the Web Audio API
const hasWebAudioSupport = () => {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
};

// Initialize audio context on user interaction
export const setupUserInteractionTracking = () => {
  if (typeof window !== 'undefined') {
    // Check if user has already interacted
    if (document.readyState === "complete" || document.readyState === "interactive") {
      // Check for existing user interaction (e.g. session storage)
      const hasInteracted = sessionStorage.getItem('userHasInteracted');
      if (hasInteracted === 'true') {
        userHasInteracted = true;
      }
    }

    const interactionEvents = ['mousedown', 'keydown', 'touchstart', 'click', 'scroll'];
    
    const handleInteraction = () => {
      console.log("👆 User interaction detected!");
      userHasInteracted = true;
      sessionStorage.setItem('userHasInteracted', 'true');
      
      // Try to initialize AudioContext on interaction
      if (!audioContext && hasWebAudioSupport()) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContext = new AudioContextClass();
          console.log("AudioContext initialized after user interaction");
        } catch (e) {
          console.warn("Failed to initialize AudioContext:", e);
        }
      }
      
      // Import sound resources here to ensure they're loaded after user interaction
      import('./soundResources').then(module => {
        module.preloadSounds();
        console.log("Sounds preloaded after user interaction");
      }).catch(err => {
        console.error("Failed to preload sounds:", err);
      });
      
      // Cleanup listeners after first interaction
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
    
    // Add listeners
    interactionEvents.forEach(event => {
      document.addEventListener(event, handleInteraction);
    });
    
    // Always treat sessions with previous interactions as interacted
    if (sessionStorage.getItem('userHasInteracted') === 'true') {
      userHasInteracted = true;
      handleInteraction();
    }
  }
};

// Check if audio can be played
export const canPlayAudio = (): boolean => {
  return userHasInteracted || sessionStorage.getItem('userHasInteracted') === 'true';
};

// Force unlock audio context
export const unlockAudio = (): boolean => {
  // Always force interaction state to true
  userHasInteracted = true;
  sessionStorage.setItem('userHasInteracted', 'true');

  // Try to resume AudioContext if suspended
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('✅ AudioContext resumed successfully');
    }).catch(e => {
      console.warn('Failed to resume AudioContext:', e);
    });
  } else if (!audioContext && hasWebAudioSupport()) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContextClass();
      console.log("AudioContext initialized during unlock");
    } catch (e) {
      console.warn("Failed to initialize AudioContext:", e);
    }
  }
  
  // Try playing a silent sound to unlock audio on iOS
  try {
    const silentSound = new Audio("data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
    silentSound.volume = 0.01; // Nearly silent
    try {
      const playPromise = silentSound.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          userHasInteracted = true;
          console.log('✅ Audio system unlocked with silent sound');
          
          // Preload sounds after successful unlock
          import('./soundResources').then(module => {
            module.preloadSounds();
          });
          
          // Immediately pause the silent sound
          setTimeout(() => {
            silentSound.pause();
            silentSound.currentTime = 0;
          }, 1);
          
          return true;
        }).catch(e => {
          console.warn('Could not unlock audio system with silent sound:', e);
          return false;
        });
      }
    } catch (e) {
      console.warn('Error attempting to play silent sound:', e);
      return false;
    }
    
    return true;
  } catch (e) {
    console.warn('Error attempting to unlock audio:', e);
    return false;
  }
};

export const getAudioInstance = (): HTMLAudioElement | null => {
  return audio;
};

export const setAudioInstance = (newAudio: HTMLAudioElement | null) => {
  // Stop any previous audio before assigning new one
  if (audio && audio !== newAudio) {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (err) {
      console.warn("Error stopping previous audio:", err);
    }
  }
  audio = newAudio;
};

// Debug function to check audio state
export const getAudioState = () => {
  return {
    userHasInteracted,
    audioContextExists: !!audioContext,
    audioContextState: audioContext ? audioContext.state : 'none',
    audioInstanceExists: !!audio,
    webAudioSupport: hasWebAudioSupport()
  };
};
