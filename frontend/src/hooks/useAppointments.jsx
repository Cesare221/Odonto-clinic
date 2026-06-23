// =============================================================================
// HOOKS/USEAPPOINTMENTS.JSX - FRONTEND - Hook para agenda/calendário
// =============================================================================
import { useState, useCallback } from 'react';
import api from '../config/axios';

export function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async (startDate, endDate) => {
    setLoading(true);
    try {
      const response = await api.get('/appointments', {
        params: { startDate, endDate }
      });
      setAppointments(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAppointment = async (appointmentData) => {
    try {
      const response = await api.post('/appointments', appointmentData);
      setAppointments(prev => [response.data.data, ...prev]);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  const updateAppointment = async (id, data) => {
    try {
      const response = await api.put(`/appointments/${id}`, data);
      setAppointments(prev => prev.map(a => a._id === id ? response.data.data : a));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  const deleteAppointment = async (id) => {
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(prev => prev.filter(a => a._id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  return { appointments, loading, error, fetchAppointments, createAppointment, updateAppointment, deleteAppointment };
}
