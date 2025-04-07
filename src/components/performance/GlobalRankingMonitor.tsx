
import { useEffect, useRef } from "react";
import { getAttendantPerformance } from "@/services/performance";
import { getMockPerformanceData } from "@/services/mockData";
import { useRankingStore } from "@/services/ranking";
import { useSettings } from "@/contexts/SettingsContext";
import PodiumConfetti from "./PodiumConfetti";

// Intervalo de atualização do ranking em milissegundos (1 minuto)
const RANKING_UPDATE_INTERVAL = 1 * 60 * 1000;

const GlobalRankingMonitor = () => {
  const { settings } = useSettings();
  const { updateRanking, showConfetti, confettiType, clearCelebration } = useRankingStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    // Função para carregar dados de ranking
    const loadRankingData = async () => {
      try {
        console.log("🏆 GlobalRankingMonitor: Buscando dados de desempenho...");
        
        let performance;
        if (isDevelopment) {
          // Use mock data in development
          performance = getMockPerformanceData();
          console.log(`🏆 GlobalRankingMonitor: Usando dados de teste com ${performance.length} atendentes`);
        } else {
          // Use real data in production
          performance = await getAttendantPerformance();
          console.log(`🏆 GlobalRankingMonitor: Atualizando ranking com ${performance.length} atendentes`);
        }
        
        if (performance.length > 0) {
          updateRanking(performance, settings);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar dados de ranking global:", error);
      }
    };

    // Carregar dados iniciais
    loadRankingData();

    // Configurar intervalo para atualizações regulares
    intervalRef.current = setInterval(loadRankingData, RANKING_UPDATE_INTERVAL);

    // Limpar intervalo ao desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateRanking, settings]);

  return (
    <PodiumConfetti 
      isActive={showConfetti}
      type={confettiType}
      onComplete={clearCelebration}
    />
  );
};

export default GlobalRankingMonitor;
