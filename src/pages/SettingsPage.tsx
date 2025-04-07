
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getAgents, getStages } from "@/services";
import { Agent, Stage } from "@/types";

import MainHeader from "@/components/MainHeader";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsTabs from "@/components/settings/SettingsTabs";
import AgentDialog from "@/components/settings/AgentDialog";

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

  // Apenas usuários admin podem ver a opção de diagnóstico
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
        
        <SettingsTabs 
          isLoading={isLoading}
          agents={agents}
          stages={stages}
          onAgentChange={loadData}
          onEditAgent={handleEditAgent}
          onNewAgent={handleNewAgent}
        />
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
