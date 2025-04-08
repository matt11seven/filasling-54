
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getAgents, getStages } from "@/services";
import { Agent, Stage } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import MainHeader from "@/components/MainHeader";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsTabs from "@/components/settings/SettingsTabs";
import AgentDialog from "@/components/settings/AgentDialog";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
      console.log("Loading settings data...");
      
      // Verificar se o token está presente
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("Token de autenticação não encontrado");
        setLoadError("Sessão expirada ou inválida. Por favor, faça login novamente.");
        toast.error("Sessão expirada, faça login novamente");
        logout();
        return;
      }
      
      const [agentsData, stagesData] = await Promise.all([
        getAgents().catch(error => {
          console.error("Error loading agents:", error);
          
          // Verificar se é erro de autenticação
          if (error.message && error.message.includes("401")) {
            throw new Error("Sessão expirada ou inválida");
          }
          
          toast.error("Erro ao carregar atendentes");
          return [];
        }),
        getStages().catch(error => {
          console.error("Error loading stages:", error);
          
          // Verificar se é erro de autenticação
          if (error.message && error.message.includes("401")) {
            throw new Error("Sessão expirada ou inválida");
          }
          
          toast.error("Erro ao carregar etapas");
          return [];
        }),
      ]);
      
      console.log("Loaded agents:", agentsData);
      console.log("Loaded stages:", stagesData);
      
      setAgents(agentsData);
      setStages(stagesData);
    } catch (error) {
      console.error("Error loading settings data:", error);
      
      // Se for erro de autenticação, fazer logout
      if (error instanceof Error && error.message.includes("Sessão expirada")) {
        setLoadError("Sessão expirada ou inválida. Por favor, faça login novamente.");
        toast.error("Sessão expirada, faça login novamente");
        logout();
      } else {
        setLoadError("Erro ao carregar dados. Tente novamente.");
        toast.error("Erro ao carregar dados de configurações");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);
  
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

  const isAdmin = user?.isAdmin === true;
  const isMaster = user?.usuario === 'matt@slingbr.com';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainHeader title="Configurações do Sistema" pendingAlerts={0} />
      
      <main className="flex-1 container py-6">
        <SettingsHeader 
          navigateBack={() => navigate("/dashboard")}
          isAdmin={isAdmin}
          isMaster={isMaster}
        />
        
        {loadError ? (
          <div className="text-center py-12 border rounded-lg mt-4">
            <p className="text-red-500 mb-4">{loadError}</p>
            {loadError.includes("Sessão expirada") ? (
              <Button onClick={() => navigate("/login")} variant="default">
                Fazer Login Novamente
              </Button>
            ) : (
              <Button onClick={loadData} variant="default">
                Tentar Novamente
              </Button>
            )}
          </div>
        ) : (
          <SettingsTabs 
            isLoading={isLoading}
            agents={agents}
            stages={stages}
            onAgentChange={loadData}
            onEditAgent={handleEditAgent}
            onNewAgent={handleNewAgent}
          />
        )}
      </main>
      
      <AgentDialog
        open={agentDialogOpen}
        onOpenChange={setAgentDialogOpen}
        selectedAgent={selectedAgent}
        onSuccess={loadData}
      />
    </div>
  );
};

export default SettingsPage;
