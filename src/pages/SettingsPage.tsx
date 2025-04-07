
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import MainHeader from "@/components/MainHeader";
import AgentList from "@/components/AgentList";
import AgentForm from "@/components/AgentForm";
import StageList from "@/components/StageList";
import AppSettingsForm from "@/components/AppSettingsForm";
import DatabaseSettings from "@/components/settings/DatabaseSettings";

import { useAuth } from "@/contexts/AuthContext";
import { getAgents, getStages } from "@/services";
import { Agent, Stage } from "@/types";
import { UserPlus, ArrowLeft, Database } from "lucide-react";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>(undefined);

  // Load data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [agentsData, stagesData] = await Promise.all([
        getAgents(),
        getStages(),
      ]);
      setAgents(agentsData);
      setStages(stagesData);
    } catch (error) {
      console.error("Error loading settings data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    loadData();
  }, []);
  
  // Check for authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setAgentDialogOpen(true);
  };
  
  const handleNewAgent = () => {
    setSelectedAgent(undefined);
    setAgentDialogOpen(true);
  };

  // Apenas usuários admin podem ver a aba de banco de dados
  const isAdmin = user?.isAdmin === true;
  const isMaster = user?.usuario === 'matt@slingbr.com';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainHeader title="Configurações do Sistema" pendingAlerts={0} />
      
      <main className="flex-1 container py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">Configurações</h2>
          </div>
        </div>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="audio">Áudio</TabsTrigger>
            <TabsTrigger value="stages">Etapas</TabsTrigger>
            <TabsTrigger value="agents">Atendentes</TabsTrigger>
            {(isAdmin || isMaster) && (
              <TabsTrigger value="database" className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                Conexão
              </TabsTrigger>
            )}
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
              <h3 className="text-lg font-medium mb-4">Gerenciamento de Etapas</h3>
              {isLoading ? (
                <div className="text-center py-12">Carregando etapas...</div>
              ) : (
                <StageList stages={stages} onStageChange={loadData} />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="agents">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Gerenciamento de Atendentes</h3>
                <Button onClick={handleNewAgent}>
                  <UserPlus className="h-4 w-4 mr-2" /> Novo Atendente
                </Button>
              </div>
              
              {isLoading ? (
                <div className="text-center py-12">Carregando atendentes...</div>
              ) : (
                <AgentList 
                  agents={agents} 
                  onAgentChange={loadData}
                  onEditAgent={handleEditAgent}
                />
              )}
            </div>
          </TabsContent>
          
          {(isAdmin || isMaster) && (
            <TabsContent value="database">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-medium mb-4">Configuração do Banco de Dados</h3>
                <DatabaseSettings />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
      
      {/* Agent Form Dialog */}
      <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAgent ? "Editar Atendente" : "Novo Atendente"}
            </DialogTitle>
          </DialogHeader>
          <AgentForm
            existingAgent={selectedAgent}
            onSuccess={() => {
              setAgentDialogOpen(false);
              loadData();
            }}
            onCancel={() => setAgentDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
