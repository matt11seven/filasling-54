
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

// Access the verbose debug setting from environment variables
const VERBOSE = typeof VERBOSE_DEBUG !== 'undefined' ? VERBOSE_DEBUG : false

export function Toaster() {
  const { toasts } = useToast()
  const { settings } = useSettings()
  const processedToastIds = useRef<Set<string>>(new Set())

  // Effect to play sounds when specific toasts are shown
  useEffect(() => {
    // Only process new toasts
    const newToasts = toasts.filter(toast => !processedToastIds.current.has(toast.id))
    
    if (newToasts.length > 0) {
      if (VERBOSE) console.log(`🔍 VERBOSE: Processing ${newToasts.length} new toasts`)
      
      newToasts.forEach(toast => {
        // Mark as processed to avoid duplicate sounds
        processedToastIds.current.add(toast.id)
        
        // Check for specific toast messages
        const description = String(toast.description || "")
        
        if (VERBOSE) console.log(`🔍 VERBOSE: Toast with description: "${description}"`)
        
        if (description.includes("Novo atendimento na fila")) {
          console.log("🔔 Novo atendimento toast detected, playing notification sound DIRECTLY")
          
          if (VERBOSE) {
            console.log("🔍 VERBOSE: Audio state before playing:", {
              userAgent: navigator.userAgent,
              hasAudioContext: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
              hasNotification: typeof Notification !== 'undefined',
              notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'undefined'
            })
          }
          
          // Unlock audio first
          unlockAudio()
          
          // Play sound directly with maximum volume for reliability
          const soundPath = "notificacao"
          const volume = 1.0 // Maximum volume
          
          // Try playing immediately
          playSound(soundPath, volume, false)
          
          // Also retry after short delays to ensure it plays
          setTimeout(() => {
            if (VERBOSE) console.log(`🔍 VERBOSE: First retry playing ${soundPath}`)
            unlockAudio()
            playSound(soundPath, volume, false)
          }, 100)
          
          setTimeout(() => {
            if (VERBOSE) console.log(`🔍 VERBOSE: Second retry playing ${soundPath}`)
            unlockAudio()
            playSound(soundPath, volume, false)
          }, 500)
          
          setTimeout(() => {
            if (VERBOSE) console.log(`🔍 VERBOSE: Third retry playing ${soundPath}`)
            unlockAudio()
            playSound(soundPath, volume, false)
          }, 1000)
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
