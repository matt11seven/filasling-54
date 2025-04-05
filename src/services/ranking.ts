
import { AttendantPerformance } from "./performance";
import { create } from "zustand";
import { toast } from "sonner";
import { playSound, playSoundByEventType } from "./notificationService";
import { AppSettings } from "@/types";

// Interfaces
interface RankingPosition {
  id: string;
  nome: string;
  position: number;
}

interface PodiumState {
  podiumPositions: RankingPosition[];
  isUpdatingRanking: boolean;
  showConfetti: boolean;
  confettiType: 'podium' | 'first-place';
  celebratingAttendant: string | null;
  // Funções
  updateRanking: (newRanking: AttendantPerformance[], settings: AppSettings) => void;
  clearCelebration: () => void;
}

// Store para gerenciar estado do pódio globalmente
export const useRankingStore = create<PodiumState>((set, get) => ({
  podiumPositions: [],
  isUpdatingRanking: false,
  showConfetti: false,
  confettiType: 'podium',
  celebratingAttendant: null,
  
  updateRanking: (newRanking, settings) => {
    if (get().isUpdatingRanking) return;
    
    set({ isUpdatingRanking: true });
    const oldPodium = get().podiumPositions;
    
    // Obter novas posições do pódio (top 3)
    const newPodium = newRanking.slice(0, 3).map((attendant, index) => ({
      id: attendant.id,
      nome: attendant.nome,
      position: index + 1
    }));
    
    // Verificar mudanças
    if (newPodium.length > 0) {
      console.log("🏆 Verificando mudanças no pódio:", { oldPodium, newPodium });
      
      // Verificar especificamente mudanças na primeira posição
      const newFirstPlace = newPodium.find(pos => pos.position === 1);
      const oldFirstPlace = oldPodium.find(pos => pos.position === 1);
      
      // Se temos um novo primeiro lugar (ID diferente)
      if (newFirstPlace && oldFirstPlace && newFirstPlace.id !== oldFirstPlace.id) {
        console.log(`🥇 NOVO PRIMEIRO LUGAR: ${newFirstPlace.nome} substituiu ${oldFirstPlace.nome}!`);
        
        // Mostrar toast e confete
        toast.success(
          `${newFirstPlace.nome.split(' ')[0]} é o novo PRIMEIRO LUGAR!`,
          {
            duration: 6000,
            icon: "🏆",
            position: "top-center",
            className: "first-place-toast"
          }
        );
        
        // Tocar som específico para primeiro lugar
        console.log(`🔊 Tocando som de primeiro lugar para: ${newFirstPlace.nome}`);
        playSoundByEventType("firstPlace", settings);
        
        set({
          showConfetti: true,
          confettiType: 'first-place',
          celebratingAttendant: newFirstPlace.nome.split(' ')[0]
        });
        
        return;
      }
      
      // Verificar outras mudanças no pódio (seguindo a lógica original)
      for (const newPos of newPodium) {
        const oldPosition = oldPodium.find(old => old.id === newPos.id);
        
        // Se a pessoa não estava no pódio antes
        if (!oldPosition) {
          console.log(`🏆 ${newPos.nome} entrou no pódio! Agora está em ${newPos.position}º lugar!`);
          
          // Para primeiro lugar novo, usar som específico
          if (newPos.position === 1) {
            console.log(`🔊 Tocando som de primeiro lugar para novo participante: ${newPos.nome}`);
            playSoundByEventType("firstPlace", settings);
            
            toast.success(
              `${newPos.nome.split(' ')[0]} é o novo PRIMEIRO LUGAR!`,
              {
                duration: 6000,
                icon: "🏆",
                position: "top-center",
                className: "first-place-toast"
              }
            );
            
            set({
              showConfetti: true,
              confettiType: 'first-place',
              celebratingAttendant: newPos.nome.split(' ')[0]
            });
          } else {
            // Mostrar toast e confete para outras posições
            toast.success(
              `${newPos.nome.split(' ')[0]} entrou no pódio! Agora está em ${newPos.position}º lugar!`,
              {
                duration: 6000,
                icon: "🏆",
                position: "top-center",
                className: "podium-toast"
              }
            );
            
            // Tocar som para novo participante no pódio
            console.log(`🔊 Tocando som para novo participante no pódio: ${newPos.nome}`);
            playSoundByEventType("podium", settings);
            
            set({
              showConfetti: true,
              confettiType: 'podium',
              celebratingAttendant: newPos.nome.split(' ')[0]
            });
          }
          
          break;
        }
        // Se melhorou a posição no pódio
        else if (oldPosition.position > newPos.position) {
          console.log(`🏆 ${newPos.nome} subiu para ${newPos.position}º lugar no pódio!`);
          
          // Para primeiro lugar novo, usar som específico
          if (newPos.position === 1) {
            console.log(`🔊 Tocando som de primeiro lugar: ${newPos.nome}`);
            playSoundByEventType("firstPlace", settings);
            
            toast.success(
              `${newPos.nome.split(' ')[0]} subiu para o PRIMEIRO LUGAR!`,
              {
                duration: 6000,
                icon: "🏆",
                position: "top-center",
                className: "first-place-toast"
              }
            );
            
            set({
              showConfetti: true,
              confettiType: 'first-place',
              celebratingAttendant: newPos.nome.split(' ')[0]
            });
          } else {
            // Mostrar toast para outras melhorias
            toast.success(
              `${newPos.nome.split(' ')[0]} subiu para ${newPos.position}º lugar no pódio!`,
              {
                duration: 6000,
                icon: "🎉",
                position: "top-center",
                className: "podium-toast"
              }
            );
            
            // Tocar som para melhoria no pódio
            console.log(`🔊 Tocando som para melhoria no pódio: ${newPos.nome}`);
            playSoundByEventType("podium", settings);
            
            set({
              showConfetti: true,
              confettiType: 'podium',
              celebratingAttendant: newPos.nome.split(' ')[0]
            });
          }
          
          break;
        }
      }
    }
    
    // Atualizar posições do pódio
    set({
      podiumPositions: newPodium,
      isUpdatingRanking: false
    });
  },
  
  clearCelebration: () => {
    console.log("🧹 Limpando celebração do pódio");
    set({
      showConfetti: false,
      celebratingAttendant: null
    });
  }
}));
