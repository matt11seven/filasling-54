
// Sound resource management

// Cache for preloaded audio objects
const audioCache: Record<string, HTMLAudioElement> = {};

// Define a list of sounds to preload
const soundsToPreload = [
  'notificacao',
  'alertabeebeep',
  'sireneindustrial',
  'cashregister',
  'senna',
  'ultrapassagem',
  'notification',  // Adicionando esse som para pré-carregamento
  'beep'           // Adicionando esse som para pré-carregamento
];

// Lista completa de sons disponíveis para seleção na interface
export const allAvailableSounds = [
  'notificacao',
  'alertabeebeep',
  'sireneindustrial',
  'cashregister',
  'senna',
  'ultrapassagem',
  'notification',
  'alert',
  'alerta',
  'beep',
  'podium',
  'firstPlace'
];

// Retorna um nome amigável para exibição com base no ID do som
export const getSoundDisplayName = (soundId: string): string => {
  if (!soundId || soundId === 'none') return 'Sem Som';
  
  // Mapeamento de IDs para nomes amigáveis
  const soundNameMap: Record<string, string> = {
    'notificacao': 'Notificação Padrão',
    'alertabeebeep': 'Alerta Beep',
    'sireneindustrial': 'Sirene Industrial',
    'cashregister': 'Caixa Registradora',
    'senna': 'Senna Ultrapassagem',
    'ultrapassagem': 'Ultrapassagem F1',
    'notification': 'Notificação Alternativa',
    'alert': 'Alerta Básico',
    'alerta': 'Alerta Brasileiro',
    'beep': 'Beep Simples',
    'podium': 'Pódio',
    'firstPlace': 'Primeiro Lugar'
  };
  
  // Retorna o nome mapeado ou o próprio ID se não houver mapeamento
  return soundNameMap[soundId] || soundId;
};

// Preload sounds for faster playback
export const preloadSounds = () => {
  console.log("Preloading sounds...");
  
  soundsToPreload.forEach(soundName => {
    const path = `/sounds/${soundName}.mp3`;
    try {
      // Create new audio object
      const audio = new Audio(path);
      
      // Add to cache
      audioCache[soundName] = audio;
      
      // Log the preloaded sound
      console.log(`Preloaded sound: ${soundName} (${path})`);
      
      // Check if file exists
      audio.addEventListener('canplaythrough', () => {
        console.log(`✅ Sound ${soundName} preloaded successfully`);
      });
      
      audio.addEventListener('error', (e) => {
        console.error(`❌ Failed to preload sound ${soundName}:`, e);
        console.error(`Error code: ${audio.error?.code}, message: ${audio.error?.message}`);
        
        // If sound failed to load, remove from cache
        delete audioCache[soundName];
      });
      
      // Start loading the audio file
      audio.load();
      
    } catch (error) {
      console.error(`Error preloading sound ${soundName}:`, error);
    }
  });
};

// Get an audio object for a sound, either from cache or creating a new one
export const getAudio = (soundType: string): HTMLAudioElement => {
  // Normalize the sound type name (remove .mp3 extension if present and path)
  const normalizedSound = soundType.replace('.mp3', '').split('/').pop() || soundType;
  
  console.log(`DEBUG getAudio: Requested sound '${soundType}', normalized to '${normalizedSound}'`);
  
  // Check if the sound is in cache
  if (audioCache[normalizedSound]) {
    console.log(`DEBUG getAudio: Found cached audio for '${normalizedSound}'`);
    
    // Clone the audio to allow multiple simultaneous playbacks
    try {
      const cachedAudio = audioCache[normalizedSound];
      
      // Instead of cloning (which doesn't always work well), create a new Audio with the same src
      const newAudio = new Audio(cachedAudio.src);
      
      // Log for debugging
      console.log(`DEBUG getAudio: Created new Audio from cache for '${normalizedSound}', src: ${newAudio.src}`);
      
      return newAudio;
    } catch (error) {
      console.error(`Error cloning cached audio for ${normalizedSound}:`, error);
      // Fall back to creating a new audio object
    }
  }
  
  // If not in cache or clone failed, create a new audio object
  const path = normalizedSound.includes('/') 
    ? normalizedSound 
    : `/sounds/${normalizedSound}${normalizedSound.endsWith('.mp3') ? '' : '.mp3'}`;
  
  console.log(`DEBUG getAudio: Creating new Audio for '${normalizedSound}' at path '${path}'`);
  
  const audio = new Audio(path);
  
  // Check if sound file exists
  audio.addEventListener('error', (e) => {
    console.error(`❌ Sound file error for '${normalizedSound}' at path '${path}':`, e);
    console.error(`Error code: ${audio.error?.code}, message: ${audio.error?.message}`);
    
    // Try a fallback if this is a notification sound
    if (normalizedSound === 'notificacao' || normalizedSound === 'notification') {
      console.log(`⚠️ Critical notification sound failed, trying fallback...`);
      const fallbackAudio = new Audio('/sounds/beep.mp3');
      return fallbackAudio;
    }
  });
  
  return audio;
};

// Test all sound files to verify they can be loaded
export const testSoundFiles = () => {
  console.log("Testing all sound files...");
  
  soundsToPreload.forEach(soundName => {
    const path = `/sounds/${soundName}.mp3`;
    const audio = new Audio(path);
    
    audio.addEventListener('canplaythrough', () => {
      console.log(`✅ Sound file test OK: ${soundName} (${path})`);
    });
    
    audio.addEventListener('error', (e) => {
      console.error(`❌ Sound file test FAILED: ${soundName} (${path})`);
      console.error(`Error code: ${audio.error?.code}, message: ${audio.error?.message}`);
    });
    
    // Start loading the audio
    audio.load();
  });
};
