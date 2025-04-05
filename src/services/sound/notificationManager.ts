
import { playSound, stopSound } from './soundPlayer';
import { unlockAudio } from './soundCore';

let notificationInterval: NodeJS.Timeout | null = null;

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
