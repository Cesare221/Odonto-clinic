import api from '../config/axios';

export const listPatients = async (params = {}) => {
  const response = await api.get('/patients', { params });
  return response?.data?.data?.patients || [];
};

export const createPatient = async (payload) => {
  const response = await api.post('/patients', payload);
  return response?.data?.data;
};

export const getPatient = async (patientId) => {
  const response = await api.get(`/patients/${patientId}`);
  return response?.data?.data;
};

export const updatePatient = async (patientId, payload) => {
  const response = await api.put(`/patients/${patientId}`, payload);
  return response?.data?.data;
};

export const deletePatient = async (patientId) => {
  const response = await api.delete(`/patients/${patientId}`);
  return response?.data;
};
