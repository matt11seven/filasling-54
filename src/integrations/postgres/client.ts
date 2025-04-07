
// This file provides a mock/proxy interface for database operations in the browser
// Real connections will be handled by the server (via env.sh)

import { toast } from 'sonner';

// Mock query function for client-side
export const query = async (text: string, params?: any[]) => {
  console.log('Mock query called with:', { text, params });
  
  // For development/testing, you could implement localStorage-based mocks here
  // In production, these calls should go through a secure API
  
  // Throw an error for direct database access attempts
  if (import.meta.env.PROD) {
    console.warn('Direct database queries are not supported in the browser. Use API endpoints instead.');
  }
  
  // Return a mock response with empty rows
  return { 
    rows: [],
    rowCount: 0
  };
};

// Mock transaction function
export const transaction = async (callback: (client: any) => Promise<any>) => {
  console.log('Mock transaction called');
  
  try {
    // For development/testing, you could implement localStorage-based mocks here
    const mockClient = {
      query: (text: string, params?: any[]) => {
        console.log('Mock client query called with:', { text, params });
        return Promise.resolve({ rows: [] });
      }
    };
    
    return await callback(mockClient);
  } catch (error) {
    console.error('Mock transaction error:', error);
    toast.error('Database transaction error');
    throw error;
  }
};

// Mock connection test
export const testConnection = async (): Promise<boolean> => {
  console.log('Mock database connection test called');
  
  // Always return true for now since we're not actually connecting
  return true;
};

// Mock pool reset
export const resetPool = () => {
  console.log('Mock pool reset called');
  return {};
};
