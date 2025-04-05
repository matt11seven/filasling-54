
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
import { playSoundByEventType } from "@/services/notificationService"
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
          console.log("🔔 Novo atendimento toast detected, playing notification sound")
          playSoundByEventType("notification", settings, undefined, false)
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
