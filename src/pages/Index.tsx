
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetConnectionCache } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// This page just redirects to dashboard
const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const init = async () => {
      try {
        // Limpar cache de conexão para garantir que estamos usando configurações atualizadas
        console.log("Inicializando aplicação, verificando configurações de conexão...");
        resetConnectionCache();
        
        // Verificar se a versão dos recursos carregados está atualizada
        const currentVersion = localStorage.getItem('app_version');
        const appVersion = import.meta.env.VITE_APP_VERSION || 'development';
        
        if (currentVersion !== appVersion) {
          console.log(`Nova versão detectada: ${appVersion}, anterior: ${currentVersion}`);
          localStorage.setItem('app_version', appVersion);
          
          // Se for uma nova versão, limpar caches
          if (currentVersion) {
            console.log("Limpando caches para nova versão");
            toast.info("Nova versão detectada, atualizando...");
            
            // Limpar outros caches relacionados à conexão
            localStorage.removeItem('db_connection_info');
            localStorage.removeItem('supabase.auth.token');
          }
        }
        
        // Usando setTimeout para garantir que o redirecionamento não bloqueie a renderização
        const redirectTimer = setTimeout(() => {
          navigate('/dashboard');
        }, 1500); // Mantido em 1500ms para dar tempo à inicialização
        
        return () => clearTimeout(redirectTimer);
      } catch (error) {
        console.error("Error during initialization:", error);
        // Mesmo com erro, ainda redirecionamos para o dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, [navigate]);

  // Adicionar botão para forçar a limpeza do cache
  const handleResetCache = () => {
    resetConnectionCache();
    localStorage.clear();
    toast.success("Cache limpo! Recarregando aplicação...");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Renderizar um fallback enquanto redireciona
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <img 
        src="/lovable-uploads/4c7404d8-ef38-4ae1-b736-66ac06729fc0.png" 
        alt="Sling Logo" 
        className="h-20 animate-pulse" 
      />
      <p className="mt-4 text-gray-500">Carregando aplicação...</p>
      
      {/* Adicionar botão de reset para emergências */}
      <button 
        onClick={handleResetCache}
        className="mt-8 text-xs text-gray-400 hover:text-gray-600 px-3 py-1 rounded-md border border-gray-200 hover:border-gray-300"
      >
        Limpar Cache
      </button>
    </div>
  );
};

export default Index;
