import api from '../config/axios';

export const exportBackup = async () => {
  const response = await api.get('/admin/backup');
  return response?.data;
};
