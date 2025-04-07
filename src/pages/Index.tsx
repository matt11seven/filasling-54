
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetConnectionCache, postgresConfig } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { testDatabaseConnection, getConnectionConfig } from '@/services/connectionTest';
import { Button } from '@/components/ui/button';

// This page just redirects to dashboard
const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
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
  
  // Testar conexão com o banco de dados
  const handleTestConnection = async () => {
    const success = await testDatabaseConnection();
    if (success) {
      toast.success("Conexão com o banco de dados estabelecida com sucesso!");
    } else {
      toast.error("Falha ao conectar ao banco de dados. Verifique as configurações.");
    }
  };
  
  // Mostrar/esconder diagnósticos
  const toggleDiagnostics = () => {
    setShowDiagnostics(!showDiagnostics);
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
      
      <div className="mt-8 flex flex-col gap-3">
        {/* Adicionar botão para testar conexão */}
        <Button 
          onClick={handleTestConnection}
          variant="outline"
          className="text-sm"
        >
          Testar Conexão com Banco
        </Button>
        
        {/* Botão para diagnósticos */}
        <Button 
          onClick={toggleDiagnostics}
          variant="secondary"
          className="text-sm"
        >
          {showDiagnostics ? "Esconder Diagnósticos" : "Mostrar Diagnósticos"}
        </Button>
        
        {/* Adicionar botão de reset para emergências */}
        <Button 
          onClick={handleResetCache}
          variant="destructive"
          className="text-sm"
        >
          Limpar Cache
        </Button>
      </div>
      
      {/* Mostrar configurações de diagnóstico */}
      {showDiagnostics && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md text-xs font-mono text-left w-full max-w-md">
          <h3 className="font-bold mb-2">Diagnóstico de Conexão:</h3>
          <pre className="whitespace-pre-wrap break-all">
            {JSON.stringify(getConnectionConfig(), null, 2)}
          </pre>
          <h3 className="font-bold mt-4 mb-2">Variáveis de Ambiente Raw:</h3>
          <pre className="whitespace-pre-wrap break-all">
            {JSON.stringify({
              DB_TYPE_RAW: typeof DB_TYPE_PLACEHOLDER !== 'undefined' ? DB_TYPE_PLACEHOLDER : 'undefined',
              DB_HOST_RAW: typeof DB_POSTGRESDB_HOST_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_HOST_PLACEHOLDER : 'undefined',
              DB_USER_RAW: typeof DB_POSTGRESDB_USER_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_USER_PLACEHOLDER : 'undefined',
              DB_DATABASE_RAW: typeof DB_POSTGRESDB_DATABASE_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_DATABASE_PLACEHOLDER : 'undefined',
              DB_PORT_RAW: typeof DB_POSTGRESDB_PORT_PLACEHOLDER !== 'undefined' ? DB_POSTGRESDB_PORT_PLACEHOLDER : 'undefined',
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Index;
