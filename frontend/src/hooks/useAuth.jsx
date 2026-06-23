// =============================================================================
// HOOKS/USEAUTH.JSX - FRONTEND - Custom hook for authentication
// =============================================================================
import { useState } from 'react';
import api from '../config/axios';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      setIsLoading(false);
      return { success: true, user };
    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.message || 'Erro ao fazer login');
      return { success: false, message: err.response?.data?.message };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
  };

  return { login, logout, isLoading, error, setError };
}
