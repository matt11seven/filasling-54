
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { AppSettings } from "@/types";
import { useSettings } from "@/contexts/SettingsContext";
import { stopSound } from "@/services/notificationService";
import { useState, useEffect } from "react";

import DisplaySettings from "@/components/settings/DisplaySettings";
import TimeSettings from "@/components/settings/TimeSettings";
import SoundSettings from "@/components/settings/SoundSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const settingsSchema = z.object({
  showUserNS: z.boolean(),
  phoneDisplayMode: z.enum(["full", "partial", "hidden"]),
  warningTimeMinutes: z.number().min(1).max(120),
  criticalTimeMinutes: z.number().min(1).max(240),
  fullScreenAlertMinutes: z.number().min(1).max(360),
  soundVolume: z.number().min(0).max(1),
  notificationSound: z.string(),
  alertSound: z.string(),
  podiumSound: z.string(),
  firstPlaceSound: z.string(),
});

interface AppSettingsFormProps {
  initialTab?: string;
}

const AppSettingsForm = ({ initialTab = "general" }: AppSettingsFormProps) => {
  const { settings, updateSettings } = useSettings();
  const [isMuted, setIsMuted] = useState(false);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const form = useForm<AppSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ...settings,
    },
  });

  // Atualiza a aba ativa quando as props mudam
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const onSubmit = (values: AppSettings) => {
    updateSettings(values);
    toast.success("Configurações atualizadas com sucesso");
  };

  const resetToDefaults = () => {
    form.reset({
      showUserNS: true,
      phoneDisplayMode: "partial",
      warningTimeMinutes: 10,
      criticalTimeMinutes: 20,
      fullScreenAlertMinutes: 30,
      soundVolume: 0.5,
      notificationSound: "notificacao",
      alertSound: "sireneindustrial",
      podiumSound: "cashregister",
      firstPlaceSound: "senna",
    });
    toast.info("Configurações restauradas para os valores padrão");
  };

  // Função para renderizar o conteúdo com base na página atual
  const renderContent = () => {
    if (initialTab === "audio") {
      // Mostra apenas as configurações de áudio
      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <SoundSettings
              form={form}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              audioPermissionGranted={audioPermissionGranted}
              setAudioPermissionGranted={setAudioPermissionGranted}
            />
            
            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={resetToDefaults}>
                Restaurar Padrões
              </Button>
              <Button type="submit">Salvar Configurações</Button>
            </div>
          </form>
        </Form>
      );
    }

    // Mostra todas as configurações organizadas em abas (para a aba "Geral")
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="general">Exibição & Tempos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-6">
              <DisplaySettings form={form} />
              <TimeSettings form={form} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={resetToDefaults}>
              Restaurar Padrões
            </Button>
            <Button type="submit">Salvar Configurações</Button>
          </div>
        </form>
      </Form>
    );
  };

  return renderContent();
};

export default AppSettingsForm;
