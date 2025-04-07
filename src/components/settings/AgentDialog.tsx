
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AgentForm from "@/components/AgentForm";
import { Agent } from "@/types";

interface AgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAgent: Agent | undefined;
  onSuccess: () => void;
}

const AgentDialog = ({ open, onOpenChange, selectedAgent, onSuccess }: AgentDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedAgent ? "Editar Atendente" : "Novo Atendente"}
          </DialogTitle>
        </DialogHeader>
        <AgentForm
          existingAgent={selectedAgent}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess();
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AgentDialog;
