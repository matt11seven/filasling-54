
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This page just redirects to dashboard
const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Usando setTimeout para garantir que o redirecionamento não bloqueie a renderização
    const redirectTimer = setTimeout(() => {
      navigate('/dashboard');
    }, 100);
    
    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  // Renderizar um fallback enquanto redireciona
  return (
    <div className="flex items-center justify-center min-h-screen">
      <img 
        src="/lovable-uploads/4c7404d8-ef38-4ae1-b736-66ac06729fc0.png" 
        alt="Sling Logo" 
        className="h-20 animate-pulse" 
      />
    </div>
  );
};

export default Index;
