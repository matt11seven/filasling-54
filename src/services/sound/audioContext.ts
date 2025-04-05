
// Audio context management for Web Audio API
let audioContext: AudioContext | null = null;

// Initialize Web Audio API for better background playback support
export const initAudioContext = () => {
  if (!audioContext) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContext();
        console.log("AudioContext initialized for better background playback");
      }
    } catch (error) {
      console.warn("Failed to create AudioContext:", error);
    }
  }
  return audioContext;
};

// Get the current audio context
export const getAudioContext = () => audioContext;

// Resume audio context if suspended
export const resumeAudioContext = async (): Promise<boolean> => {
  if (audioContext && audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      console.log('✅ AudioContext resumed successfully');
      return true;
    } catch (error) {
      console.warn('Failed to resume AudioContext:', error);
      return false;
    }
  }
  return false;
};
