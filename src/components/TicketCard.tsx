
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Ticket, Stage } from "@/types";
import { formatTimeSince, getTimeStatus } from "@/utils/timeUtils";
import { formatPhoneDisplay } from "@/utils/phoneUtils";
import { useSettings } from "@/contexts/SettingsContext";

interface TicketCardProps {
  ticket: Ticket;
  stages: Stage[];
  onStatusChange?: (ticketId: string, newStageNumber: number, systemNumber?: number) => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, stages, onStatusChange }) => {
  const { settings } = useSettings();
  const { showUserNS, phoneDisplayMode, warningTimeMinutes, criticalTimeMinutes } = settings;
  const [, forceUpdate] = useState<number>(0);
  
  // Find current stage
  const currentStage = stages.find((stage) => stage.numero === ticket.etapa_numero);
  
  // Calculate time status - always from creation time regardless of stage
  // Handle both data_criado and data_criacao for compatibility
  const creationDate = ticket.data_criado || ticket.data_criacao;
  const timeInfo = getTimeStatus(
    creationDate,
    warningTimeMinutes,
    criticalTimeMinutes
  );

  // Update time display every second
  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 1000); // Update every second
    
    return () => clearInterval(timer);
  }, []);
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Calculate waiting time if the ticket has been attended to
  const getWaitingTimeInfo = () => {
    if (ticket.data_saida_etapa1 && ticket.etapa_numero !== 1) {
      const waitStart = new Date(creationDate || '');
      const waitEnd = new Date(ticket.data_saida_etapa1);
      const waitTimeMs = waitEnd.getTime() - waitStart.getTime();
      
      // Convert to minutes
      const waitTimeMinutes = Math.floor(waitTimeMs / (1000 * 60));
      
      // Format the waiting time
      if (waitTimeMinutes < 60) {
        return `${waitTimeMinutes} min de espera`;
      } else {
        const hours = Math.floor(waitTimeMinutes / 60);
        const minutes = waitTimeMinutes % 60;
        return `${hours}h ${minutes}min de espera`;
      }
    }
    return null;
  };
  
  const waitingTimeInfo = getWaitingTimeInfo();

  // Determine the correct time display color based on the current stage
  const getTimeDisplayColor = () => {
    // For stage 1 (waiting), use the warning/critical colors
    if (ticket.etapa_numero === 1) {
      if (timeInfo.status === "critical") {
        return "text-critical animate-pulse-attention";
      } else if (timeInfo.status === "warning") {
        return "text-warning";
      }
    }
    
    // For other stages, use the stage color with reduced opacity for better readability
    return currentStage?.cor ? `text-[${currentStage.cor}]/80` : "text-muted-foreground";
  };

  return (
    <div className="animate-slide-in">
      <Card className="relative overflow-hidden">
        {/* Stage color indicator */}
        <div
          className="stage-indicator"
          style={{ backgroundColor: currentStage?.cor || "#808080" }}
        />
        
        <CardContent className="p-4 pl-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg">{ticket.nome}</h3>
              {ticket.telefone && (
                <p className="text-sm text-muted-foreground">
                  {formatPhoneDisplay(ticket.telefone, phoneDisplayMode || 'hidden')}
                </p>
              )}
            </div>
            
            {/* Agent info */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-sm">{ticket.nome_atendente || ticket.email_atendente}</span>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={ticket.url_imagem_atendente} />
                  <AvatarFallback>
                    {getInitials(ticket.nome_atendente || ticket.email_atendente || '')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs text-muted-foreground">{ticket.email_atendente}</span>
            </div>
          </div>
          
          <div className="mb-2">
            <p className="text-sm font-medium">Motivo:</p>
            <p className="text-sm">{ticket.motivo}</p>
          </div>
          
          {ticket.setor && (
            <div className="mb-2">
              <p className="text-sm font-medium">Setor:</p>
              <p className="text-sm">{ticket.setor}</p>
            </div>
          )}
          
          {/* Optional UserNS display based on settings */}
          {showUserNS && ticket.user_ns && (
            <div className="mb-2">
              <p className="text-sm font-medium">ID:</p>
              <p className="text-sm">{ticket.user_ns}</p>
            </div>
          )}
          
          {/* Waiting time info */}
          {waitingTimeInfo && (
            <div className="mb-2">
              <p className="text-xs text-amber-600 font-medium">{waitingTimeInfo}</p>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-3">
            <Badge
              style={{
                backgroundColor: currentStage?.cor || "#808080",
                color: "#fff",
              }}
            >
              {currentStage?.nome || "Desconhecido"}
            </Badge>
            
            <span
              className={getTimeDisplayColor()}
              style={
                ticket.etapa_numero !== 1 && currentStage?.cor
                  ? { color: currentStage.cor }
                  : undefined
              }
            >
              {formatTimeSince(creationDate || '')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketCard;
