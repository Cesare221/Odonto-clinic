import { useCallback, useEffect, useState } from 'react';
import api from '../config/axios';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearAuthState = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (errorValue) {
      console.error('Erro ao realizar logout no servidor:', errorValue);
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  const refreshAuth = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return false;
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const meResponse = await api.get('/auth/me');
      setUser(meResponse.data.data);
      setIsAuthenticated(true);

      return true;
    } catch {
      return false;
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      const response = await api.get('/auth/me');
      setUser(response.data.data);
      setIsAuthenticated(true);
    } catch {
      const refreshed = await refreshAuth();
      if (!refreshed) {
        await logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout, refreshAuth]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void checkAuth();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user: nextUser } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      setUser(nextUser);
      setIsAuthenticated(true);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao fazer login';
      setError(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', userData);
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao criar conta';
      setError(message);
      return { success: false, message };
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    clearError,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
