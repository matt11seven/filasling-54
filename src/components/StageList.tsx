
import { useState } from "react";
import { Stage } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStage } from "@/services";
import { toast } from "sonner";
import { Edit, Check, X, ArrowUp, ArrowDown } from "lucide-react";
import ColorPicker from "./ColorPicker";

interface StageListProps {
  stages: Stage[];
  onStageChange: () => void;
}

interface EditingStage {
  id: string;
  nome: string;
  cor: string;
}

const StageList = ({ stages, onStageChange }: StageListProps) => {
  const [editingStage, setEditingStage] = useState<EditingStage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (stage: Stage) => {
    setEditingStage({
      id: stage.id,
      nome: stage.nome,
      cor: stage.cor,
    });
  };

  const handleCancel = () => {
    setEditingStage(null);
  };

  const handleSave = async () => {
    if (!editingStage) return;
    
    try {
      setIsSubmitting(true);
      
      await updateStage(editingStage.id, {
        nome: editingStage.nome,
        cor: editingStage.cor,
      });
      
      toast.success("Etapa atualizada com sucesso");
      onStageChange();
      setEditingStage(null);
    } catch (error) {
      console.error("Error updating stage:", error);
      toast.error("Erro ao atualizar etapa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const moveStage = async (stage: Stage, direction: "up" | "down") => {
    try {
      // Find adjacent stage
      const sortedStages = [...stages].sort((a, b) => a.numero - b.numero);
      const currentIndex = sortedStages.findIndex((s) => s.id === stage.id);
      
      if (direction === "up" && currentIndex > 0) {
        const prevStage = sortedStages[currentIndex - 1];
        
        // Swap numbers
        await updateStage(stage.id, { numero: prevStage.numero });
        await updateStage(prevStage.id, { numero: stage.numero });
        
        onStageChange();
        toast.success("Ordem das etapas atualizada");
      } else if (direction === "down" && currentIndex < sortedStages.length - 1) {
        const nextStage = sortedStages[currentIndex + 1];
        
        // Swap numbers
        await updateStage(stage.id, { numero: nextStage.numero });
        await updateStage(nextStage.id, { numero: stage.numero });
        
        onStageChange();
        toast.success("Ordem das etapas atualizada");
      }
    } catch (error) {
      console.error("Error reordering stages:", error);
      toast.error("Erro ao reordenar etapas");
    }
  };

  // Sort stages by numero
  const sortedStages = [...stages].sort((a, b) => a.numero - b.numero);

  return (
    <div className="space-y-4">
      {sortedStages.map((stage) => (
        <Card key={stage.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-2" 
                style={{ backgroundColor: stage.cor }} 
              />
              <span>Etapa {stage.numero}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingStage && editingStage.id === stage.id ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`stage-name-${stage.id}`}>Nome</Label>
                  <Input
                    id={`stage-name-${stage.id}`}
                    value={editingStage.nome}
                    onChange={(e) => setEditingStage({ ...editingStage, nome: e.target.value })}
                  />
                </div>
                
                <ColorPicker
                  label="Cor"
                  color={editingStage.cor}
                  onChange={(color) => setEditingStage({ ...editingStage, cor: color })}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={handleSave} 
                    disabled={isSubmitting}
                  >
                    <Check className="h-4 w-4 mr-1" /> Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{stage.nome}</p>
                  <p className="text-sm text-muted-foreground">{stage.cor}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveStage(stage, "up")}
                    disabled={stage.numero === 1}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveStage(stage, "down")}
                    disabled={stage.numero === sortedStages.length}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(stage)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StageList;
