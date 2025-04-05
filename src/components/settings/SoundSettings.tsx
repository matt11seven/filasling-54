
import React, { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { AppSettings } from "@/types";
import { unlockAudio, canPlayAudio, debugAudioSystems, preloadSounds, stopSound } from "@/services/notificationService";

import AudioPermissionBanner from "./AudioPermissionBanner";
import SoundTypeSelector from "./SoundTypeSelector";
import VolumeControl from "./VolumeControl";
import SoundTester from "./SoundTester";

interface SoundSettingsProps {
  form: UseFormReturn<AppSettings>;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  audioPermissionGranted: boolean;
  setAudioPermissionGranted: React.Dispatch<React.SetStateAction<boolean>>;
}

const SoundSettings = ({ 
  form,
  isMuted,
  setIsMuted,
  audioPermissionGranted,
  setAudioPermissionGranted
}: SoundSettingsProps) => {
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    stopSound();
    
    if (!isMuted) {
      toast.info("Som desativado");
    } else {
      toast.info("Som ativado");
      // Tenta desbloquear o áudio quando desmutado
      unlockAudio();
    }
  };

  // Efeito para verificar permissões de áudio sempre que o componente for montado
  useEffect(() => {
    console.log("SoundSettings component mounted");
    
    const checkAudioPermission = () => {
      const canPlay = canPlayAudio();
      setAudioPermissionGranted(canPlay);
      
      // Log current audio state
      console.log("Audio system state:", debugAudioSystems());
      
      return canPlay;
    };
    
    checkAudioPermission();
    
    // Tentar desbloquear o áudio também
    unlockAudio();
    
    // Try preloading sounds
    preloadSounds();
    
    // Adicionar listener para interações do usuário para atualizar o estado
    const handleUserInteraction = () => {
      console.log("User interaction detected in SoundSettings");
      
      // Desbloquear o áudio
      unlockAudio();
      
      // Try preloading sounds after interaction
      preloadSounds();
      
      // Atualizar estado de permissão
      const canPlay = canPlayAudio();
      if (canPlay && !audioPermissionGranted) {
        setAudioPermissionGranted(true);
        toast.success("Sons ativados com sucesso!");
      }
      
      // Log updated audio state
      console.log("After interaction audio state:", debugAudioSystems());
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      // Limpar quaisquer sons em reprodução quando o componente for desmontado
      stopSound();
      // Remover listeners
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [audioPermissionGranted, setAudioPermissionGranted]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Configurações de Som</h2>
      
      <AudioPermissionBanner audioPermissionGranted={audioPermissionGranted} />
      
      <div className="space-y-4 border rounded-md p-4">
        <h3 className="text-md font-medium">Selecione sons para cada evento</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SoundTypeSelector 
            form={form} 
            soundType="notificationSound" 
            label="Som de Novo Atendimento" 
          />
          
          <SoundTypeSelector 
            form={form} 
            soundType="alertSound" 
            label="Som de Alerta de Atraso" 
          />
          
          <SoundTypeSelector 
            form={form} 
            soundType="podiumSound" 
            label="Som de Entrada no Pódio" 
          />
          
          <SoundTypeSelector 
            form={form} 
            soundType="firstPlaceSound" 
            label="Som de Primeiro Lugar" 
          />
        </div>
      </div>
      
      <VolumeControl 
        form={form} 
        isMuted={isMuted} 
        onToggleMute={toggleMute} 
      />
      
      <SoundTester 
        soundType={form.getValues("notificationSound")}
        volume={form.getValues("soundVolume")}
        isMuted={isMuted}
        audioPermissionGranted={audioPermissionGranted}
        setAudioPermissionGranted={setAudioPermissionGranted}
        formValues={form.getValues()} // Pass all current form values
      />
    </div>
  );
};

export default SoundSettings;
