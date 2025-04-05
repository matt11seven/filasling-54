
// Sound options with URLs for audio files
export const soundOptions = {
  // Custom sounds only
  alertabeebeep: "/sounds/alertabeebeep.mp3",
  cashregister: "/sounds/cashregister.mp3",
  notificacao: "/sounds/notificacao.mp3",
  senna: "/sounds/senna.mp3",
  sireneindustrial: "/sounds/sireneindustrial.mp3",
  ultrapassagem: "/sounds/ultrapassagem.mp3",
};

// Available sound files in the sounds directory
// This includes only the custom sounds uploaded by users
export const availableSoundFiles: string[] = [
  // Custom sound files
  "alertabeebeep.mp3",
  "cashregister.mp3",
  "notificacao.mp3",
  "senna.mp3",
  "sireneindustrial.mp3",
  "ultrapassagem.mp3"
];

// All available sounds (only custom sounds now)
export const allAvailableSounds: string[] = [
  // Only custom sounds
  "alertabeebeep",
  "cashregister",
  "notificacao",
  "senna",
  "sireneindustrial",
  "ultrapassagem"
];

// Function to get nice display name from a filename
export const getSoundDisplayName = (filename: string | undefined): string => {
  // Handle undefined or null filenames
  if (!filename) {
    return "Som Desconhecido";
  }
  
  // Remove file extension
  const nameWithoutExtension = filename.replace('.mp3', '');
  
  // Make it more readable (capitalize first letter, handle special cases)
  switch(nameWithoutExtension) {
    case 'alertabeebeep': return 'Alerta Beep';
    case 'cashregister': return 'Caixa Registradora';
    case 'notificacao': return 'Notificação';
    case 'senna': return 'Senna';
    case 'sireneindustrial': return 'Sirene Industrial';
    case 'ultrapassagem': return 'Ultrapassagem';
    case 'none': return 'Sem Som';
    default:
      // For other files, capitalize first letter and add spaces before uppercase letters
      return nameWithoutExtension
        .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters
        .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  }
};

// Map to store preloaded audio objects
const audioCache: Record<string, HTMLAudioElement> = {};

// Preload sounds for better performance
export const preloadSounds = () => {
  console.log("Preloading sounds...");
  
  // Clean cache first
  Object.keys(audioCache).forEach(key => {
    delete audioCache[key];
  });

  // Preload each sound
  Object.entries(soundOptions).forEach(([key, soundUrl]) => {
    try {
      const audio = new Audio(soundUrl);
      audio.preload = "auto";
      
      // Cache the audio object
      audioCache[key] = audio;
      
      // This will start loading the audio file
      audio.load();
      
      console.log(`Preloaded sound: ${key} (${soundUrl})`);
    } catch (error) {
      console.error(`Failed to preload sound ${key}:`, error);
    }
  });
  
  return Object.keys(audioCache).length > 0;
};

// Get cached audio object if available, or create a new one
export const getAudio = (soundType: string): HTMLAudioElement => {
  // Se o tipo de som for "none", vamos retornar um Audio vazio que não vai tocar nada
  if (soundType === "none") {
    console.log("Requested 'none' sound type, returning silent audio");
    const silentAudio = new Audio();
    silentAudio.volume = 0;
    return silentAudio;
  }
  
  console.log(`Getting audio for sound type: "${soundType}"`);
  
  // Check if it's a standard sound or a custom file
  let soundUrl: string;
  
  if (soundType in soundOptions) {
    // Standard sound type
    soundUrl = soundOptions[soundType as keyof typeof soundOptions];
    console.log(`Standard sound: ${soundType} -> ${soundUrl}`);
  } else if (soundType.endsWith('.mp3')) {
    // Custom sound file
    soundUrl = `/sounds/${soundType}`;
    console.log(`Custom sound file: ${soundType} -> ${soundUrl}`);
  } else {
    // Fallback to notificacao
    console.warn(`Unknown sound type: "${soundType}", falling back to notificacao`);
    soundUrl = soundOptions.notificacao;
  }
  
  // Always create a new instance for reliable playback
  console.log(`Creating new audio instance for: ${soundType} (${soundUrl})`);
  const newAudio = new Audio(soundUrl);
  newAudio.preload = "auto";
  newAudio.load(); // Force immediate loading
  return newAudio;
};
