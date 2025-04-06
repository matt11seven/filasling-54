import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

import MainHeader from "@/components/MainHeader";
import FullscreenAlert from "@/components/FullscreenAlert";
import Footer from "@/components/Footer";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TicketTabView from "@/components/dashboard/TicketTabView";
import NewTicketDialog from "@/components/dashboard/NewTicketDialog";

import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getTickets, getStages } from "@/services";
import { getTimeStatus } from "@/utils/timeUtils";
import { Stage, Ticket } from "@/types";
import { toast } from "sonner";
import { getAttendantPerformance } from "@/services/performance";
import { useRankingStore } from "@/services/ranking";
import { unlockAudio } from "@/services/notificationService";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const { updateRanking } = useRankingStore();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTicketDialogOpen, setNewTicketDialogOpen] = useState(false);
  const [criticalTicket, setCriticalTicket] = useState<Ticket | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());
  const [lastAlertCheck, setLastAlertCheck] = useState<number>(Date.now());
  
  useEffect(() => {
    unlockAudio();
    console.log("Dashboard page loaded - Audio unlocked for notifications");
  }, []);
  
  useEffect(() => {
    const checkPerformance = async () => {
      try {
        console.log("🏆 DashboardPage: Verificando performance para atualização do pódio");
        const performance = await getAttendantPerformance();
        if (performance.length > 0) {
          updateRanking(performance, settings);
        }
      } catch (error) {
        console.error("Erro ao verificar performance:", error);
      }
    };
    
    checkPerformance();
    const performanceInterval = setInterval(checkPerformance, 1 * 60 * 1000);
    
    return () => clearInterval(performanceInterval);
  }, [updateRanking, settings]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ticketsData, stagesData] = await Promise.all([
        getTickets(),
        getStages(),
      ]);
      setTickets(ticketsData);
      setStages(stagesData);
      
      setLastAlertCheck(Date.now());
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  useEffect(() => {
    const checkForCriticalTickets = () => {
      console.log("Checking for critical tickets...");
      const waitingTickets = tickets.filter((ticket) => ticket.etapa_numero === 1);
      
      for (const ticket of waitingTickets) {
        const creationDate = ticket.data_criado || ticket.data_criacao;
        const timeInfo = getTimeStatus(
          creationDate,
          settings.warningTimeMinutes,
          settings.criticalTimeMinutes
        );
        
        if (timeInfo.minutes >= settings.fullScreenAlertMinutes && !dismissedAlerts.has(ticket.id)) {
          console.log(`Critical ticket found: ${ticket.id}, time: ${timeInfo.minutes} minutes`);
          setCriticalTicket(ticket);
          return;
        }
      }
      
      setCriticalTicket(null);
    };
    
    checkForCriticalTickets();
    
    const intervalId = setInterval(() => {
      console.log("Interval check for critical tickets");
      setLastAlertCheck(Date.now());
    }, 15000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [tickets, settings, dismissedAlerts, lastAlertCheck]);
  
  const pendingTicketsCount = tickets.filter(
    (ticket) => ticket.etapa_numero === 1
  ).length;

  const handleCloseAlert = (ticketId: string) => {
    setDismissedAlerts(prev => {
      const newSet = new Set(prev);
      newSet.add(ticketId);
      return newSet;
    });
    setCriticalTicket(null);
  };
  
  const handleDismissAllAlerts = () => {
    const currentWaitingTickets = tickets.filter(ticket => ticket.etapa_numero === 1);
    
    const newDismissed = new Set(dismissedAlerts);
    currentWaitingTickets.forEach(ticket => newDismissed.add(ticket.id));
    
    setDismissedAlerts(newDismissed);
    setCriticalTicket(null);
    
    const dismissedCount = currentWaitingTickets.length;
    toast.success(`${dismissedCount} ${dismissedCount === 1 ? 'alerta foi dispensado' : 'alertas foram dispensados'}`);
    
    console.log("Current waiting tickets dismissed:", 
      currentWaitingTickets.map(t => t.id),
      "Total dismissed count:", newDismissed.size
    );
  };

  const handleTicketCreated = () => {
    setNewTicketDialogOpen(false);
    loadData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainHeader title="Sistema de Fila de Atendimento" pendingAlerts={pendingTicketsCount} />
      
      <main className="flex-1 container py-6">
        <DashboardHeader onNewTicket={() => setNewTicketDialogOpen(true)} />
        
        <TicketTabView 
          tickets={tickets}
          stages={stages}
          isLoading={isLoading}
          onTicketChange={loadData}
        />
      </main>
      
      <NewTicketDialog 
        open={newTicketDialogOpen}
        onOpenChange={setNewTicketDialogOpen}
        onTicketCreated={handleTicketCreated}
      />
      
      {criticalTicket && (
        <FullscreenAlert 
          ticket={criticalTicket} 
          onClose={() => handleCloseAlert(criticalTicket.id)}
          onDismissAll={handleDismissAllAlerts}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default DashboardPage;
