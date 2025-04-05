
// Sound state tracking
let lastPlayedAudio: HTMLAudioElement | null = null;

// Get the last played audio instance
export const getLastPlayedAudio = (): HTMLAudioElement | null => lastPlayedAudio;

// Set the last played audio instance
export const setLastPlayedAudio = (audio: HTMLAudioElement | null) => {
  lastPlayedAudio = audio;
};

// Clean up the last played audio instance
export const cleanupLastPlayedAudio = () => {
  if (lastPlayedAudio) {
    try {
      lastPlayedAudio.pause();
      lastPlayedAudio.currentTime = 0;
      lastPlayedAudio = null;
      return true;
    } catch (error) {
      console.error("❌ Error cleaning up last played sound:", error);
      return false;
    }
  }
  return false;
};
