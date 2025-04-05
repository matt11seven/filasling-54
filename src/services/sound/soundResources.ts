
// Sound options with URLs for audio files
export const soundOptions = {
  notification: "/sounds/notification.mp3",
  alert: "/sounds/alert.mp3",
  beep: "/sounds/beep.mp3",
  podium: "/sounds/podium.mp3",
  firstPlace: "/sounds/firstPlace.mp3",
};

// Available sound files in the sounds directory
// This includes only the custom sounds uploaded by users
export const availableSoundFiles: string[] = [
  // Additional sound files from the image
  "alertabeebep.mp3",
  "cashregister.mp3",
  "notificacao.mp3",
  "senna.mp3",
  "sireneindustrial.mp3",
  "ultrapassagem.mp3"
];

// Combinação de todos os sons disponíveis (padrões e personalizados)
export const allAvailableSounds: string[] = [
  // Sons padrão do sistema
  "notification",
  "alert",
  "beep",
  "podium", 
  "firstPlace",
  // Sons personalizados
  ...availableSoundFiles
];

// Function to get nice display name from a filename
export const getSoundDisplayName = (filename: string): string => {
  // Remove file extension
  const nameWithoutExtension = filename.replace('.mp3', '');
  
  // Make it more readable (capitalize first letter, handle special cases)
  switch(nameWithoutExtension) {
    case 'notification': return 'Som de Notificação';
    case 'alert': return 'Som de Alerta';
    case 'beep': return 'Som de Beep';
    case 'podium': return 'Som de Pódio';
    case 'firstPlace': return 'Som de Primeiro Lugar';
    case 'alerta': return 'Som de Alerta (Alt)';
    case 'alertabeebep': return 'Alerta Beep';
    case 'cashregister': return 'Caixa Registradora';
    case 'notificacao': return 'Notificação';
    case 'senna': return 'Senna';
    case 'sireneindustrial': return 'Sirene Industrial';
    case 'ultrapassagem': return 'Ultrapassagem';
    case 'none': return 'Sem Som';
    default:
      // Para arquivos personalizados, capitaliza a primeira letra e adiciona espaços antes de letras maiúsculas
      return nameWithoutExtension
        .replace(/([A-Z])/g, ' $1') // Adiciona espaço antes de letras maiúsculas
        .replace(/^./, str => str.toUpperCase()); // Capitaliza a primeira letra
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
  
  // Preload custom sounds
  availableSoundFiles.forEach(filename => {
    try {
      const soundUrl = `/sounds/${filename}`;
      const audio = new Audio(soundUrl);
      audio.preload = "auto";
      
      // Cache the audio object
      audioCache[filename] = audio;
      
      // This will start loading the audio file
      audio.load();
      
      console.log(`Preloaded custom sound: ${filename} (${soundUrl})`);
    } catch (error) {
      console.error(`Failed to preload sound ${filename}:`, error);
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
    // Fallback to notification
    console.warn(`Unknown sound type: "${soundType}", falling back to notification`);
    soundUrl = soundOptions.notification;
  }
  
  // If we have a cached version, clone it for safe usage
  if (audioCache[soundType]) {
    console.log(`Using cached audio for: ${soundType}`);
    // O problema é que clonar o audio não é uma boa ideia, melhor criar nova instância
    const newAudio = new Audio(soundUrl);
    newAudio.preload = "auto";
    return newAudio;
  }
  
  // Fall back to new instance if not cached
  console.log(`Creating new audio instance for: ${soundType} (${soundUrl})`);
  const newAudio = new Audio(soundUrl);
  newAudio.preload = "auto";
  return newAudio;
};
