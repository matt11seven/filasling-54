
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// This page just redirects to dashboard
const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const init = async () => {
      try {
        // Usando setTimeout para garantir que o redirecionamento não bloqueie a renderização
        const redirectTimer = setTimeout(() => {
          navigate('/dashboard');
        }, 1500); // Increased from 100ms to 1500ms to give more time for initialization
        
        return () => clearTimeout(redirectTimer);
      } catch (error) {
        console.error("Error during initialization:", error);
        // Even if there's an error, we still want to navigate to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, [navigate]);

  // Renderizar um fallback enquanto redireciona
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <img 
        src="/lovable-uploads/4c7404d8-ef38-4ae1-b736-66ac06729fc0.png" 
        alt="Sling Logo" 
        className="h-20 animate-pulse" 
      />
      <p className="mt-4 text-gray-500">Carregando aplicação...</p>
    </div>
  );
};

export default Index;
