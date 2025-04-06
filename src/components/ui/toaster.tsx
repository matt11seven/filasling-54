
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useEffect, useRef } from "react"
import { playSound, unlockAudio } from "@/services/notificationService"
import { useSettings } from "@/contexts/SettingsContext"

export function Toaster() {
  const { toasts } = useToast()
  const { settings } = useSettings()
  const processedToastIds = useRef<Set<string>>(new Set())

  // Effect to play sounds when specific toasts are shown
  useEffect(() => {
    // Only process new toasts
    const newToasts = toasts.filter(toast => !processedToastIds.current.has(toast.id))
    
    if (newToasts.length > 0) {
      newToasts.forEach(toast => {
        // Mark as processed to avoid duplicate sounds
        processedToastIds.current.add(toast.id)
        
        // Check for specific toast messages
        const description = String(toast.description || "")
        
        if (description.includes("Novo atendimento na fila")) {
          console.log("🔔 Novo atendimento toast detected, playing notification sound DIRECTLY")
          
          // Unlock audio context first to ensure it can play
          unlockAudio()
          
          // Use the user's configured volume setting
          const volume = settings.soundVolume || 0.5 // Default to 0.5 if not defined
          
          // CRITICAL: Play the sound with a more direct approach for notification
          playNotificationSound("notificacao", volume)
        }
      })
      
      // Clean up old processed IDs to prevent memory leaks
      if (processedToastIds.current.size > 100) {
        const idsToKeep = toasts.map(t => t.id)
        const newProcessedIds = new Set<string>()
        idsToKeep.forEach(id => {
          if (processedToastIds.current.has(id)) {
            newProcessedIds.add(id)
          }
        })
        processedToastIds.current = newProcessedIds
      }
    }
  }, [toasts, settings])

  // Dedicated function for playing notification sounds
  const playNotificationSound = (soundName: string, volume: number) => {
    console.log(`🎵 Attempting to play notification sound: ${soundName} with volume ${volume}`)
    
    // Ensure audio is unlocked
    unlockAudio()
    
    // Get the proper path
    const soundPath = soundName.includes('/') ? soundName : `/sounds/${soundName}.mp3`
    console.log(`🎵 Using sound path: ${soundPath}`)
    
    // Create a new audio element directly
    const audio = new Audio(soundPath)
    audio.volume = Math.min(1, Math.max(0, volume)) // Ensure volume is between 0 and 1
    
    // Set attributes for mobile playback
    audio.setAttribute('playsinline', 'true')
    audio.setAttribute('preload', 'auto')
    
    // Log events for debugging
    audio.addEventListener('play', () => console.log(`▶️ Sound ${soundName} started playing`))
    audio.addEventListener('playing', () => console.log(`✅ Sound ${soundName} is now playing`))
    audio.addEventListener('error', (e) => console.error(`❌ Error playing sound ${soundName}:`, e))
    
    // Force loading before playing
    audio.load()
    
    // Play with promise handling
    const playPromise = audio.play().catch(error => {
      console.error(`❌ Failed to play ${soundName}:`, error)
      
      // If autoplay was prevented, try again after a short delay
      if (error.name === 'NotAllowedError') {
        console.warn('⚠️ Autoplay prevented. Trying again...')
        
        setTimeout(() => {
          unlockAudio()
          audio.play().catch(e => console.error(`Retry failed for ${soundName}:`, e))
        }, 300)
      }
    })
    
    // Try again with delay to ensure it plays
    setTimeout(() => {
      const retryAudio = new Audio(soundPath)
      retryAudio.volume = Math.min(1, Math.max(0, volume))
      retryAudio.play().catch(e => console.log('Scheduled retry - ignoring if already playing:', e))
    }, 500)
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
