
import { playSound, stopSound } from './soundPlayer';
import { unlockAudio } from './soundCore';

let notificationInterval: NodeJS.Timeout | null = null;
let visibilityChangeHandler: ((event: Event) => void) | null = null;

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
  // Force 100% volume for critical alerts
  const actualVolume = volume >= 0.9 ? 1.0 : volume; // If volume is already high (≥90%), force to 100%
  const success = playSound(soundType, actualVolume, false);
  
  // Request notification permission if needed for background alerts
  if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      console.log(`Notification permission: ${permission}`);
    });
  }
  
  // Then set up interval only if first play was successful
  if (success) {
    // Setup visibility change handler for minimized window - store reference to remove it later
    visibilityChangeHandler = () => {
      if (document.hidden && notificationInterval) {
        // When tab becomes hidden, play sound immediately to ensure it starts in background
        playSound(soundType, actualVolume, false);
      }
    };
    
    // Listen for visibility changes with stored handler reference
    document.addEventListener('visibilitychange', visibilityChangeHandler);
    
    notificationInterval = setInterval(() => {
      playSound(soundType, actualVolume, false);
    }, intervalSeconds * 1000);
    
    console.log(`🔔 Started alert notification with sound: ${soundType}, volume: ${actualVolume}, interval: ${intervalSeconds}s`);
    return true;
  }
  
  return false;
};

export const stopAlertNotification = () => {
  stopSound();
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
    
    // Remove visibility change handler if it exists
    if (visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', visibilityChangeHandler);
      visibilityChangeHandler = null;
    }
    
    console.log("🔕 Alert notification stopped");
    return true;
  }
  return false;
};

// Check current notification state
export const isNotificationActive = (): boolean => {
  return notificationInterval !== null;
};
