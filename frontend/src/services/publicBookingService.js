import api from '../config/axios';

export const fetchPublicBookingAvailability = async (params = {}) => {
  const response = await api.get('/appointments/public-booking/availability', { params });
  return response?.data?.data || { slots: [] };
};

export const createPublicBooking = async (payload) => {
  const response = await api.post('/appointments/public-booking', payload);
  return response?.data?.data;
};
