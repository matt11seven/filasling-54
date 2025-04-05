
/// <reference types="vite/client" />

// Global variables for placeholder replacements
declare const SUPABASE_URL_PLACEHOLDER: string;
declare const SUPABASE_ANON_KEY_PLACEHOLDER: string;
declare const VERBOSE_DEBUG: boolean;

// Add WebKit AudioContext type
interface Window {
  webkitAudioContext: typeof AudioContext;
}
