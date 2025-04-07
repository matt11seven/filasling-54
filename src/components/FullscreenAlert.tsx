
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Ticket } from "@/types";
import { getTimeStatus, formatTimeSince } from "@/utils/timeUtils";
import { useSettings } from "@/contexts/SettingsContext";
import { stopAlertNotification, playSound, unlockAudio, debugAudioSystems, playSoundByEventType } from "@/services/notificationService";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FullscreenAlertProps {
  ticket: Ticket;
  onClose: () => void;
  onDismissAll: () => void;
}

const FullscreenAlert = ({ ticket, onClose, onDismissAll }: FullscreenAlertProps) => {
  const { settings } = useSettings();
  const [isVisible, setIsVisible] = useState(false);
  const [soundPlayed, setSoundPlayed] = useState(false);
  const [, forceUpdate] = useState<number>(0);

  useEffect(() => {
    // Log audio system state for debugging
    console.log("FullscreenAlert mounted, audio system state:", debugAudioSystems());
    
    // Primeiro pára qualquer som de alerta existente
    stopAlertNotification();
    
    // Tenta desbloquear o áudio primeiro (importante para iOS/Safari)
    unlockAudio();
    
    // Função para tentar reproduzir o som do alerta quando o popup abrir
    const tryPlaySound = () => {
      // Solicitar desbloqueio de som antes de tentar reproduzir
      unlockAudio();
      
      // Usar playSoundByEventType para garantir consistência com as configurações
      // Importante: false para loop, pois queremos tocar apenas uma vez
      const success = playSoundByEventType("alert", settings, settings.soundVolume, false);
      
      if (success) {
        setSoundPlayed(true);
        console.log("✅ Som de alerta crítico iniciado com sucesso");
      } else {
        console.warn("⚠️ Falha ao reproduzir som de alerta crítico, tentará novamente na interação");
        toast.warning("Clique na tela para permitir sons de alerta", { duration: 5000 });
      }
    };
    
    // Tocar o som imediatamente quando o componente montar
    tryPlaySound();
    
    // Configurar event listener para interação do usuário
    const handleUserInteraction = () => {
      if (!soundPlayed) {
        console.log("Interação do usuário detectada em FullscreenAlert, tentando reproduzir som...");
        tryPlaySound();
      }
    };
    
    // Adiciona event listeners para interação do usuário
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    // Animação de entrada
    setTimeout(() => setIsVisible(true), 100);
    
    // Update time display every second
    const timer = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 1000); // Update every second
    
    // Limpeza
    return () => {
      stopAlertNotification();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      clearInterval(timer);
    };
  }, [settings, soundPlayed]);

  // Formata o tempo desde a criação
  const creationDate = ticket.data_criado || ticket.data_criacao;
  const { minutes } = getTimeStatus(
    creationDate, 
    settings.warningTimeMinutes, 
    settings.criticalTimeMinutes
  );
  
  // Obtenha a contagem de tempo formatada
  const timeDisplay = formatTimeSince(creationDate || '');
  
  // Gerar iniciais para o avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Espera a animação terminar
    stopAlertNotification();
  };

  const handleDismissAll = () => {
    setIsVisible(false);
    setTimeout(onDismissAll, 300); // Espera a animação terminar
    stopAlertNotification();
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => {
        // Try to unlock audio on any click on the alert
        unlockAudio();
        if (!soundPlayed) {
          playSoundByEventType("alert", settings, settings.soundVolume, false);
          setSoundPlayed(true);
        }
      }}
    >
      <div className="bg-card border border-destructive p-8 rounded-lg max-w-md w-full animate-pulse-attention">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-destructive">ATENDIMENTO CRÍTICO</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X />
          </Button>
        </div>
        
        <div className="space-y-4 mb-6">
          {(ticket.nome_atendente || ticket.url_imagem_atendente) && (
            <div className="flex items-center gap-2 mb-1">
              {ticket.url_imagem_atendente && (
                <Avatar className="w-6 h-6">
                  <AvatarImage src={ticket.url_imagem_atendente} alt={ticket.nome_atendente || ''} />
                  <AvatarFallback>{getInitials(ticket.nome_atendente || '')}</AvatarFallback>
                </Avatar>
              )}
              {ticket.nome_atendente && (
                <span className="text-sm font-medium">Atendente: {ticket.nome_atendente}</span>
              )}
            </div>
          )}
          <p className="text-lg"><strong>Cliente:</strong> {ticket.nome}</p>
          <p><strong>Motivo:</strong> {ticket.motivo || "Não especificado"}</p>
          <p><strong>Setor:</strong> {ticket.setor || "Não especificado"}</p>
          <p className="text-destructive font-bold">
            Aguardando há {timeDisplay}
          </p>
        </div>
        
        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={handleDismissAll}>
            Dispensar Alertas Atuais
          </Button>
          <Button variant="destructive" onClick={handleClose}>
            Fechar Alerta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FullscreenAlert;
