
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DatabaseDiagnostic from "./DatabaseDiagnostic";

interface SettingsHeaderProps {
  navigateBack: () => void;
  isAdmin: boolean;
  isMaster: boolean;
}

const SettingsHeader = ({ navigateBack, isAdmin, isMaster }: SettingsHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={navigateBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold">Configurações</h2>
      </div>
      
      <DatabaseDiagnostic isAdmin={isAdmin} isMaster={isMaster} />
    </div>
  );
};

export default SettingsHeader;
