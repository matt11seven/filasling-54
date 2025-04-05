
// This file serves as a facade to maintain backward compatibility
// It re-exports all functionality from the refactored modules

// Re-export from sound core
import { setupUserInteractionTracking, canPlayAudio, unlockAudio, getAudioState } from './sound/soundCore';
export { canPlayAudio, unlockAudio, getAudioState };

// Re-export from sound resources
import { preloadSounds } from './sound/soundResources';
export { preloadSounds };

// Re-export from sound player
import { playSound, stopSound, startAlertNotification, stopAlertNotification, isNotificationActive } from './sound/soundPlayer';
export { playSound, stopSound, startAlertNotification, stopAlertNotification, isNotificationActive };

// Re-export from browser notifications
import { requestNotificationPermission, sendBrowserNotification } from './notifications/browserNotifications';
export { requestNotificationPermission, sendBrowserNotification };

// Função auxiliar para reproduzir som com base nas configurações do usuário
export const playSoundByEventType = (
  eventType: "notification" | "alert" | "podium" | "firstPlace", 
  settings: any, 
  volume?: number
): boolean => {
  // Se nenhuma configuração for fornecida, retorne falso
  if (!settings) {
    console.warn("playSoundByEventType: settings object is missing");
    return false;
  }
  
  try {
    console.log(`playSoundByEventType: Playing sound for event: ${eventType}`);
    
    // Mapeia o tipo de evento para a configuração correspondente
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
    
    // Tenta pegar configuração do som
    const soundType = settings[soundSetting];
    
    if (!soundType) {
      console.warn(`playSoundByEventType: No sound configured for ${eventType} (${soundSetting})`);
      return false;
    }
    
    // Adiciona log mais detalhado para debug
    console.log(`playSoundByEventType: Tipo de evento '${eventType}' mapeado para configuração '${soundSetting}' com valor '${soundType}'`);
    
    // Se o tipo de som for "none", não toca nada
    if (soundType === "none") {
      console.log(`playSoundByEventType: Sound type is "none" for ${eventType}, not playing`);
      return true;
    }
    
    // Tenta desbloquear o áudio primeiro
    unlockAudio();
    
    // Usa o volume das configurações ou o volume fornecido
    const soundVolume = volume !== undefined ? volume : (
      settings.soundVolume !== undefined ? settings.soundVolume : 0.5
    );
    
    console.log(`playSoundByEventType: Playing sound ${soundType} with volume ${soundVolume}`);
    
    return playSound(soundType, soundVolume, false);
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
