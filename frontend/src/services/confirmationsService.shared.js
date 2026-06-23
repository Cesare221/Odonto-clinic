export const createConfirmationsService = (client) => ({
  async fetchPublicRescheduleOptions(token) {
    const response = await client.get(`/appointments/public-reschedule-options/${token}`);
    return response?.data?.data || [];
  },

  async submitPublicConfirmation(token, payload) {
    const response = await client.post(`/appointments/confirm/${token}`, payload);
    return response?.data;
  },
});

export const fetchPublicRescheduleOptions = async (token, service) => (
  service.fetchPublicRescheduleOptions(token)
);

export const submitPublicConfirmation = async (token, payload, service) => (
  service.submitPublicConfirmation(token, payload)
);
