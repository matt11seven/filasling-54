
import React, { createContext, useState, useContext, useEffect } from "react";
import { AppSettings } from "@/types";

type SettingsContextType = {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
};

// Default settings
const defaultSettings: AppSettings = {
  showUserNS: true,
  phoneDisplayMode: "partial",
  warningTimeMinutes: 10,
  criticalTimeMinutes: 20,
  fullScreenAlertMinutes: 30,
  soundVolume: 0.5,
  // Verificando se os sons padrão estão corretos
  notificationSound: "notificacao",
  alertSound: "sireneindustrial",
  podiumSound: "cashregister",
  firstPlaceSound: "senna", // Confirmando que este está configurado para "senna"
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem("queueAppSettings");
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        console.log("Loaded settings from localStorage:", parsedSettings);
        
        // Ensure notificationSound is always set to a valid value
        if (!parsedSettings.notificationSound) {
          console.log("⚠️ notificationSound not set in saved settings, using default");
          parsedSettings.notificationSound = defaultSettings.notificationSound;
        }
        
        // Ensure phoneDisplayMode is always set to a valid value
        if (!parsedSettings.phoneDisplayMode || parsedSettings.phoneDisplayMode === "none") {
          console.log("⚠️ phoneDisplayMode not set or invalid in saved settings, using default");
          parsedSettings.phoneDisplayMode = defaultSettings.phoneDisplayMode;
        }
        
        setSettings(parsedSettings);
      } catch (e) {
        console.error("Error parsing saved settings:", e);
        // If there's an error parsing, use defaults
        setSettings(defaultSettings);
      }
    } else {
      console.log("No saved settings found, using defaults:", defaultSettings);
    }
    
    // Log notification sound setting at startup
    console.log("🔔 Current notification sound setting:", 
      settings.notificationSound || defaultSettings.notificationSound);
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    
    // Log when notification sound is changed
    if (newSettings.notificationSound && newSettings.notificationSound !== settings.notificationSound) {
      console.log(`🔔 Notification sound changed: ${settings.notificationSound} -> ${newSettings.notificationSound}`);
    }
    
    setSettings(updatedSettings);
    localStorage.setItem("queueAppSettings", JSON.stringify(updatedSettings));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
