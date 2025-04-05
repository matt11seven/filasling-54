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
  // Updated default sounds using the available custom sounds
  notificationSound: "notificacao",
  alertSound: "sireneindustrial",
  podiumSound: "cashregister",
  firstPlaceSound: "senna",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem("queueAppSettings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Error parsing saved settings:", e);
        // If there's an error parsing, use defaults
        setSettings(defaultSettings);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
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
