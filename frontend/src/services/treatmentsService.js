import api from '../config/axios';

export const createTreatmentSession = async (payload) => {
  const response = await api.post('/treatments', payload);
  return response?.data?.data;
};

export const updateTreatmentSession = async (sessionId, payload) => {
  const response = await api.put(`/treatments/${sessionId}`, payload);
  return response?.data?.data;
};

export const finalizeTreatmentSession = async (sessionId, payload) => {
  const response = await api.post(`/treatments/${sessionId}/finalize`, payload);
  return response?.data?.data;
};
