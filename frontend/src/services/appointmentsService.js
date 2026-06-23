import api from '../config/axios';

export const listAppointments = async (params = {}) => {
  const response = await api.get('/appointments', { params });
  return response?.data?.data || [];
};

export const createAppointment = async (payload) => {
  const response = await api.post('/appointments', payload);
  return response?.data?.data;
};

export const deleteAppointment = async (appointmentId) => {
  const response = await api.delete(`/appointments/${appointmentId}`);
  return response?.data;
};

export const generateConfirmationLink = async (appointmentId) => {
  const response = await api.post(`/appointments/${appointmentId}/confirmation-link`);
  return response?.data?.data;
};

export const updateAttendanceStatus = async (appointmentId, attendanceStatus) => {
  const response = await api.patch(`/appointments/${appointmentId}/attendance-status`, { attendanceStatus });
  return response?.data?.data;
};

export const updateConfirmationHandled = async (appointmentId, handled = true) => {
  const response = await api.patch(`/appointments/${appointmentId}/confirmation-handled`, { handled });
  return response?.data?.data;
};

export const updateRescheduleRequest = async (appointmentId, payload) => {
  const response = await api.patch(`/appointments/${appointmentId}/reschedule-request`, payload);
  return response?.data?.data;
};
