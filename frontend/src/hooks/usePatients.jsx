// =============================================================================
// HOOKS/USEPATIENTS.JSX - FRONTEND - Custom hook for patient CRUD
// =============================================================================
import { useState, useCallback } from 'react';
import api from '../config/axios';

export function usePatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPatients = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await api.get('/patients', {
        params: { page, limit: 20, search }
      });
      setPatients(response.data.data.patients);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar pacientes');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPatient = async (patientData) => {
    try {
      const response = await api.post('/patients', patientData);
      setPatients(prev => [response.data.data, ...prev]);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  const updatePatient = async (id, patientData) => {
    try {
      const response = await api.put(`/patients/${id}`, patientData);
      setPatients(prev => prev.map(p => p._id === id ? response.data.data : p));
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  const deletePatient = async (id) => {
    try {
      await api.delete(`/patients/${id}`);
      setPatients(prev => prev.filter(p => p._id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  return { patients, loading, error, fetchPatients, createPatient, updatePatient, deletePatient };
}
