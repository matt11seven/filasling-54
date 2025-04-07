
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This page just redirects to dashboard
const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/dashboard');
  }, [navigate]);

  return null;
};

export default Index;
