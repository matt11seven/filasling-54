
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
import { toast } from "sonner";

import MainHeader from "@/components/MainHeader";
import AgentList from "@/components/AgentList";
import AgentForm from "@/components/AgentForm";
import StageList from "@/components/StageList";
import AppSettingsForm from "@/components/AppSettingsForm";

import { useAuth } from "@/contexts/AuthContext";
import { getAgents, getStages } from "@/services";
import { checkDatabaseConnection } from "@/services/connectionTest";
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
  const [connectionStatus, setConnectionStatus] = useState<{ connected: boolean; message: string; diagnostics?: any }>();

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

  // Diagnóstico da conexão com o banco de dados
  const handleDiagnosticCheck = async () => {
    try {
      const status = await checkDatabaseConnection();
      setConnectionStatus(status);
      if (status.connected) {
        toast.success("Configurações de banco de dados encontradas!");
      } else {
        toast.error("Problema ao acessar configurações de banco de dados.");
      }
      console.log("Diagnóstico da conexão:", status);
    } catch (error) {
      console.error("Erro ao verificar configurações:", error);
      toast.error("Erro ao verificar configurações de banco de dados");
    }
  };

  // Apenas usuários admin podem ver a opção de diagnóstico
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
          
          {(isAdmin || isMaster) && (
            <Button variant="outline" onClick={handleDiagnosticCheck} className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              Diagnosticar BD
            </Button>
          )}
        </div>
        
        {connectionStatus && (isAdmin || isMaster) && (
          <div className={`mb-6 p-4 rounded-md border ${connectionStatus.connected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <h3 className={`font-medium ${connectionStatus.connected ? 'text-green-700' : 'text-yellow-700'}`}>
              Diagnóstico do Banco de Dados
            </h3>
            <p className={connectionStatus.connected ? 'text-green-600' : 'text-yellow-600'}>
              {connectionStatus.message}
            </p>
            {connectionStatus.diagnostics && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">Detalhes técnicos</summary>
                <pre className="mt-2 bg-slate-100 p-2 rounded overflow-auto max-h-56 text-xs">
                  {JSON.stringify(connectionStatus.diagnostics, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
        
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
