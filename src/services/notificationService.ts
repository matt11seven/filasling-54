
// This file serves as a facade to maintain backward compatibility
// It re-exports all functionality from the refactored modules

// Re-export from sound core
import { setupUserInteractionTracking, canPlayAudio, unlockAudio, getAudioState } from './sound/soundCore';
export { canPlayAudio, unlockAudio, getAudioState };

// Re-export from sound resources
import { preloadSounds, getAudio } from './sound/soundResources';
export { preloadSounds };

// Re-export from sound player
import { playSound, stopSound, startAlertNotification, stopAlertNotification, isNotificationActive } from './sound/soundPlayer';
export { playSound, stopSound, startAlertNotification, stopAlertNotification, isNotificationActive };

// Re-export from browser notifications
import { requestNotificationPermission, sendBrowserNotification } from './notifications/browserNotifications';
export { requestNotificationPermission, sendBrowserNotification };

// Helper function to request all necessary permissions for background audio
export const requestBackgroundAudioPermission = async (): Promise<boolean> => {
  // First unlock audio
  const audioUnlocked = unlockAudio();
  
  // Then request notification permission (helps with background audio in some browsers)
  let notificationPermission = false;
  
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      notificationPermission = true;
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      notificationPermission = permission === "granted";
    }
  }
  
  console.log(`Background audio permissions: Audio unlocked: ${audioUnlocked}, Notifications: ${notificationPermission}`);
  return audioUnlocked && notificationPermission;
};

// Helper function to play sound by event type
export const playSoundByEventType = (
  eventType: "notification" | "alert" | "podium" | "firstPlace", 
  settings: any, 
  volume?: number,
  loop: boolean = false
): boolean => {
  // If no settings are provided, return false
  if (!settings) {
    console.warn("playSoundByEventType: settings object is missing");
    return false;
  }
  
  try {
    console.log(`playSoundByEventType: Playing sound for event: ${eventType}`);
    
    // Map event type to corresponding setting
    const soundSettingsMap: Record<string, string> = {
      notification: "notificationSound",
      alert: "alertSound",
      podium: "podiumSound",
      firstPlace: "firstPlaceSound"
    };
    
    const soundSetting = soundSettingsMap[eventType];
    
    if (!soundSetting) {
      console.warn(`playSoundByEventType: Unknown event type: ${eventType}`);
      return false;
    }
    
    // Try to get sound configuration - explicitly check for the setting value
    const soundType = settings[soundSetting];
    
    console.log(`playSoundByEventType: Using sound setting from '${soundSetting}': '${soundType}'`);
    
    if (!soundType) {
      console.warn(`playSoundByEventType: No sound configured for ${eventType} (${soundSetting}), defaulting to notificacao`);
      // Default to notificacao.mp3 if no sound is configured
      return playSound("notificacao", volume !== undefined ? volume : (settings.soundVolume || 0.5), loop);
    }
    
    // Add more detailed log for debugging
    console.log(`playSoundByEventType: Event type '${eventType}' mapped to config '${soundSetting}' with value '${soundType}'`);
    
    // If sound type is "none", don't play anything
    if (soundType === "none") {
      console.log(`playSoundByEventType: Sound type is "none" for ${eventType}, not playing`);
      return true;
    }
    
    // Try to unlock audio first
    unlockAudio();
    
    // Use volume from settings or provided volume
    const soundVolume = volume !== undefined ? volume : (
      settings.soundVolume !== undefined ? settings.soundVolume : 0.5
    );
    
    // Para alertas, podemos querer configurações específicas (como loop)
    const shouldLoop = eventType === "alert" ? true : loop;
    
    console.log(`playSoundByEventType: Playing sound ${soundType} with volume ${soundVolume}, loop: ${shouldLoop}`);
    
    // Important: Try loading the audio first to ensure it's ready to play
    try {
      const audio = getAudio(soundType);
      audio.load();
    } catch (err) {
      console.warn("Failed to preload audio:", err);
    }
    
    return playSound(soundType, soundVolume, shouldLoop);
  } catch (error) {
    console.error("Error in playSoundByEventType:", error);
    return false;
  }
};

// Debug function to check all audio systems
export const debugAudioSystems = () => {
  const state = getAudioState();
  console.log("Audio System Status:");
  console.log("-----------------");
  console.log(`User has interacted: ${state.userHasInteracted}`);
  console.log(`Web Audio API Support: ${state.webAudioSupport}`);
  console.log(`AudioContext exists: ${state.audioContextExists}`);
  if (state.audioContextExists) {
    console.log(`AudioContext state: ${state.audioContextState}`);
  }
  console.log(`Active audio instance: ${state.audioInstanceExists ? 'Yes' : 'No'}`);
  console.log(`Browser supports Notifications: ${"Notification" in window}`);
  if ("Notification" in window) {
    console.log(`Notification permission: ${Notification.permission}`);
  }
  console.log(`Page is visible: ${!document.hidden}`);
  console.log("-----------------");
  return state;
};

// Create audio files to use in public folder if they don't exist
// This function doesn't actually run - it's just a reminder that real audio files are needed
const ensureAudioFilesExist = () => {
  console.warn(
    "Please ensure that real audio files exist at:\n" +
    "- /public/sounds/notification.mp3\n" + 
    "- /public/sounds/alert.mp3\n" + 
    "- /public/sounds/beep.mp3\n" +
    "- /public/sounds/podium.mp3\n" +
    "- /public/sounds/firstPlace.mp3\n" +
    "These should be real MP3 files, not placeholder text files."
  );
};

// Execute setup on module import (to maintain original behavior)
setupUserInteractionTracking();
