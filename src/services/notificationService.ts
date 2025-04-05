
// This file serves as a facade to maintain backward compatibility
// It re-exports all functionality from the refactored modules

// Re-export from sound core
import { setupUserInteractionTracking, canPlayAudio, unlockAudio, getAudioState } from './sound/soundCore';
export { canPlayAudio, unlockAudio, getAudioState };

// Re-export from sound resources
import { preloadSounds, getAudio } from './sound/soundResources';
export { preloadSounds, getAudio };

// Re-export from sound player and notification manager
import { playSound, stopSound } from './sound/soundPlayer';
import { startAlertNotification, stopAlertNotification, isNotificationActive } from './sound/notificationManager';
export { playSound, stopSound, startAlertNotification, stopAlertNotification, isNotificationActive };

// Re-export from browser notifications
import { requestNotificationPermission, sendBrowserNotification } from './notifications/browserNotifications';
export { requestNotificationPermission, sendBrowserNotification };

// Re-export from audio context
import { initAudioContext, resumeAudioContext } from './sound/audioContext';
export { initAudioContext, resumeAudioContext };

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
    
    // Try to get sound configuration
    const soundType = settings[soundSetting];
    
    console.log(`playSoundByEventType: Using sound setting from '${soundSetting}': '${soundType}'`);
    
    if (!soundType || soundType === "none") {
      // If sound type is "none" or not set, don't play anything
      if (soundType === "none") {
        console.log(`playSoundByEventType: Sound type is "none" for ${eventType}, not playing`);
        return true; // Return true since this is expected behavior
      }
      
      if (!soundType) {
        console.warn(`playSoundByEventType: No sound configured for ${eventType} (${soundSetting}), defaulting to notificacao`);
        // Try to play a default sound
        return playSound("notificacao", volume !== undefined ? volume : (settings.soundVolume || 0.5), loop);
      }
    }
    
    // Add more detailed log for debugging
    console.log(`playSoundByEventType: Event type '${eventType}' mapped to config '${soundSetting}' with value '${soundType}'`);
    
    // Try to unlock audio first (for iOS/Safari)
    unlockAudio();
    
    // Use volume from settings or provided volume
    const soundVolume = volume !== undefined ? volume : (
      settings.soundVolume !== undefined ? settings.soundVolume : 0.5
    );
    
    // Force soundVolume to be at least 0.5 to ensure it's audible
    const finalVolume = Math.max(soundVolume, 0.5);
    
    console.log(`playSoundByEventType: Playing sound ${soundType} with volume ${finalVolume}, loop: ${loop}`);
    
    // Directly play the sound using the appropriate type
    const success = playSound(soundType, finalVolume, loop);
    
    if (!success) {
      console.warn(`playSoundByEventType: Failed to play sound ${soundType}, trying again with a delay`);
      // Try again after a small delay
      setTimeout(() => {
        unlockAudio();
        playSound(soundType, finalVolume, loop);
      }, 300);
    }
    
    return success;
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

// Execute setup on module import (to maintain original behavior)
setupUserInteractionTracking();
