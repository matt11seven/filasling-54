import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useRef } from "react"
import { playSound, unlockAudio, playSoundByEventType } from "@/services/notificationService"
import { useSettings } from "@/contexts/SettingsContext"
import { ToastViewport } from "@/components/ui/toast"

// Import sonner first for type augmentation
import "sonner"

const ToastProvider = ToastPrimitives.Provider

const toastVariants = cva(
  "group w-full rounded-md border p-4 text-sm shadow-sm transition-all",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "bg-destructive text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "ml-auto flex h-10 items-center justify-center rounded-md px-2 text-sm font-medium ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<typeof ToastAction>

export function Toaster() {
  const { toasts } = useToast()
  const { settings } = useSettings()
  const processedToastIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    const newToasts = toasts.filter(toast => !processedToastIds.current.has(toast.id))
    
    if (newToasts.length > 0) {
      console.log("New toasts detected:", newToasts.map(t => ({ id: t.id, description: t.description })));
      
      newToasts.forEach(toast => {
        processedToastIds.current.add(toast.id)
        
        // Improved detection for new ticket notifications
        // Check title, description, and id
        const isNewTicketNotification = 
          (toast.description && String(toast.description).includes("Novo atendimento na fila")) || 
          (toast.id === 'new-ticket-notification');
        
        if (isNewTicketNotification) {
          console.log("🔔 New ticket toast detected in Toaster component, id:", toast.id); 
          console.log("🔈 DEBUG Toaster: Current notification sound setting:", settings.notificationSound);
          
          // Ensure audio is unlocked
          unlockAudio();
          
          // Use a slight delay to ensure UI rendering doesn't block audio
          setTimeout(() => {
            // SEMPRE usar volume 100% para notificações de novo ticket
            // independentemente da configuração do usuário
            console.log(`🎵 Toaster attempting to play sound: ${settings.notificationSound}`);
            const success = playSound(settings.notificationSound, 1.0, false);
            
            if (success) {
              console.log(`✅ Toaster playing notification sound: ${settings.notificationSound} at FORCED maximum volume (100%)`);
            } else {
              console.error(`❌ Toaster failed to play notification sound: ${settings.notificationSound}`);
              
              // Tentar novamente após um curto atraso
              setTimeout(() => {
                console.log("⏱️ Delayed retry from Toaster component");
                unlockAudio();
                const retrySuccess = playSound(settings.notificationSound, 1.0, false);
                console.log(`🔁 Toaster retry play attempt: ${retrySuccess ? "succeeded" : "failed"}`);
                
                // Se ainda falhar, tente com um nome de som codificado
                if (!retrySuccess) {
                  console.log("🔄 Trying hardcoded fallback sound in Toaster");
                  const lastAttempt = playSound("notificacao", 1.0, false);
                  console.log(`🎵 Last resort sound attempt from Toaster: ${lastAttempt ? "succeeded" : "failed"}`);
                }
              }, 500);
            }
          }, 100);
        }
      });
      
      // Cleanup old toast IDs to prevent memory leaks
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

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
