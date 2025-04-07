
import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { useRankingStore } from "@/services/ranking";
import { 
  getAttendantPerformance, 
  getAttendantStrikes, 
  AttendantPerformance, 
  StrikeData 
} from "@/services/performance";
import { getMockPerformanceData, getMockStrikesData } from "@/services/mockData";

export const usePerformanceData = () => {
  const { settings } = useSettings();
  const { updateRanking } = useRankingStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<AttendantPerformance[]>([]);
  const [strikesData, setStrikesData] = useState<StrikeData[]>([]);
  
  const isDevelopment = import.meta.env.DEV;

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isDevelopment) {
        // Use mock data in development environment
        const performance = getMockPerformanceData();
        const strikes = getMockStrikesData();
        
        setPerformanceData(performance);
        setStrikesData(strikes);
        
        // Update ranking store
        updateRanking(performance, settings);
      } else {
        // Use real API in production
        const [performance, strikes] = await Promise.all([
          getAttendantPerformance(),
          getAttendantStrikes(settings.criticalTimeMinutes)
        ]);
        
        setPerformanceData(performance);
        setStrikesData(strikes);
        
        // Update ranking store
        updateRanking(performance, settings);
      }
    } catch (error) {
      console.error("Erro ao carregar dados de desempenho:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [settings.criticalTimeMinutes]);

  return {
    isLoading,
    performanceData,
    strikesData,
    loadData
  };
};
