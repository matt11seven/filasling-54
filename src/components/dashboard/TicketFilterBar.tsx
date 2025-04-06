import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, ArrowDown, ArrowUp } from "lucide-react";
import { Ticket, Agent, Stage } from "@/types";
import { getAgents, getStages } from "@/services";

interface TicketFilterBarProps {
  tickets: Ticket[];
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
  selectedAgent: string;
  setSelectedAgent: (agent: string) => void;
  sortOrder: "desc" | "asc";
  setSortOrder: (order: "desc" | "asc") => void;
  clearFilters: () => void;
}

const TicketFilterBar = ({
  tickets,
  selectedSector,
  setSelectedSector,
  selectedAgent,
  setSelectedAgent,
  sortOrder,
  setSortOrder,
  clearFilters,
}: TicketFilterBarProps) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  
  // Get unique sectors from tickets (handling possible undefined values)
  const sectors = Array.from(
    new Set(tickets.filter(t => t.setor).map(t => t.setor as string))
  );
  
  // Fetch agents on component mount
  useEffect(() => {
    const loadAgents = async () => {
      setIsLoadingAgents(true);
      
      try {
        const agentsData = await getAgents();
        setAgents(agentsData);
      } catch (error) {
        console.error("Error loading agents:", error);
      } finally {
        setIsLoadingAgents(false);
      }
    };
    
    loadAgents();
  }, []);
  
  // Toggle sort order
  const toggleSortOrder = () => {
    const newSortOrder = sortOrder === "desc" ? "asc" : "desc";
    setSortOrder(newSortOrder);
  };

  return (
    <div className="bg-muted/30 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Filter size={16} className="text-muted-foreground" />
        <h3 className="text-sm font-medium">Filtros e Ordenação</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sector Filter */}
        <div>
          <label htmlFor="sector-filter" className="text-xs text-muted-foreground mb-1 block">
            Filtrar por Setor
          </label>
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger id="sector-filter" className="w-full">
              <SelectValue placeholder="Todos os setores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              {sectors.map(sector => (
                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Agent Email Filter */}
        <div>
          <label htmlFor="agent-filter" className="text-xs text-muted-foreground mb-1 block">
            Filtrar por Atendente
          </label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger id="agent-filter" className="w-full">
              <SelectValue placeholder="Todos os atendentes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os atendentes</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.email}>{agent.nome} ({agent.email})</SelectItem>
              ))}
              {isLoadingAgents && <SelectItem value="loading" disabled>Carregando...</SelectItem>}
            </SelectContent>
          </Select>
        </div>
        
        {/* Sort Order & Clear Filters */}
        <div className="flex items-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleSortOrder}
            className="flex items-center gap-1 h-10 flex-grow"
          >
            {sortOrder === "desc" ? (
              <>
                <ArrowDown size={16} />
                <span>Mais recentes</span>
              </>
            ) : (
              <>
                <ArrowUp size={16} />
                <span>Mais antigos</span>
              </>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-10"
          >
            Limpar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketFilterBar;
