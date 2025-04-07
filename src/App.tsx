
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import PerformancePage from "./pages/PerformancePage";
import NotFound from "./pages/NotFound";
import { useState } from "react";
import GlobalRankingMonitor from "./components/performance/GlobalRankingMonitor";

function App() {
  // Move the QueryClient initialization inside the component function
  // This ensures it's created in the React component lifecycle
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <SettingsProvider>
              <Toaster />
              <Sonner position="top-center" closeButton richColors />
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/performance" element={<PerformancePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <GlobalRankingMonitor />
            </SettingsProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
