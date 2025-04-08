
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserPlus, RefreshCw } from "lucide-react";
import { Agent, Stage } from "@/types";

import AppSettingsForm from "@/components/AppSettingsForm";
import AgentList from "@/components/AgentList";
import StageList from "@/components/StageList";
import { useState } from "react";
import { toast } from "sonner";

interface SettingsTabsProps {
  isLoading: boolean;
  agents: Agent[];
  stages: Stage[];
  onAgentChange: () => void;
  onEditAgent: (agent: Agent) => void;
  onNewAgent: () => void;
}

const SettingsTabs = ({
  isLoading,
  agents,
  stages,
  onAgentChange,
  onEditAgent,
  onNewAgent
}: SettingsTabsProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      // Usando a função onAgentChange como atualizador geral
      // (ela atualiza tanto agents quanto stages)
      await onAgentChange();
      toast.success("Dados atualizados com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      toast.error("Erro ao atualizar dados");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid grid-cols-4 mb-6">
        <TabsTrigger value="general">Geral</TabsTrigger>
        <TabsTrigger value="audio">Áudio</TabsTrigger>
        <TabsTrigger value="stages">Etapas</TabsTrigger>
        <TabsTrigger value="agents">Atendentes</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-lg font-medium mb-4">Configurações Gerais</h3>
          <AppSettingsForm />
        </div>
      </TabsContent>
      
      <TabsContent value="audio">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-lg font-medium mb-4">Configurações de Áudio</h3>
          <AppSettingsForm initialTab="audio" />
        </div>
      </TabsContent>
      
      <TabsContent value="stages">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Gerenciamento de Etapas</h3>
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> 
              Atualizar
            </Button>
          </div>
          
          {isLoading || isRefreshing ? (
            <div className="text-center py-12">Carregando etapas...</div>
          ) : stages.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="mb-4 text-muted-foreground">Nenhuma etapa encontrada.</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
              </Button>
            </div>
          ) : (
            <StageList stages={stages} onStageChange={onAgentChange} />
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="agents">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Gerenciamento de Atendentes</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing || isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                Atualizar
              </Button>
              <Button onClick={onNewAgent}>
                <UserPlus className="h-4 w-4 mr-2" /> Novo Atendente
              </Button>
            </div>
          </div>
          
          {isLoading || isRefreshing ? (
            <div className="text-center py-12">Carregando atendentes...</div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="mb-4 text-muted-foreground">Nenhum atendente encontrado.</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
              </Button>
            </div>
          ) : (
            <AgentList 
              agents={agents} 
              onAgentChange={onAgentChange}
              onEditAgent={onEditAgent}
            />
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default SettingsTabs;
