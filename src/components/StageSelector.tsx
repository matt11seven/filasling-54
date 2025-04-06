
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stage, Ticket } from "@/types";

interface StageSelectorProps {
  stages: Stage[];
  currentStage: number;
  ticket: Ticket;
  onStageChange: (ticketId: string, stageNumber: number, systemNumber?: number) => Promise<void>;
}

const StageSelector = ({
  stages,
  currentStage,
  ticket,
  onStageChange,
}: StageSelectorProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStageChange = async (value: string) => {
    try {
      setIsLoading(true);
      const newStageNumber = parseInt(value, 10);
      
      // Find the corresponding stage to get numeroSistema
      const selectedStage = stages.find(s => s.numero === newStageNumber);
      
      await onStageChange(
        ticket.id, 
        newStageNumber,
        selectedStage?.numeroSistema
      );
    } catch (error) {
      console.error("Failed to update stage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Find current stage object
  const currentStageObj = stages.find((s) => s.numero === currentStage);

  return (
    <Select
      onValueChange={handleStageChange}
      defaultValue={currentStage.toString()}
      disabled={isLoading}
    >
      <SelectTrigger 
        className="w-full" 
        style={{
          backgroundColor: currentStageObj?.cor || "#808080",
          color: "white",
          borderColor: "transparent"
        }}
      >
        <SelectValue placeholder="Selecionar Etapa" />
      </SelectTrigger>
      <SelectContent>
        {stages
          .sort((a, b) => a.numero - b.numero)
          .map((stage) => (
            <SelectItem 
              key={stage.id} 
              value={stage.numero.toString()}
              className="flex items-center gap-2"
            >
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: stage.cor }}
              />
              {stage.nome}
              {stage.numeroSistema && (
                <span className="text-xs text-muted-foreground ml-1">
                  (Sistema: {stage.numeroSistema})
                </span>
              )}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};

export default StageSelector;
