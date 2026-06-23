import api from '../config/axios';

export const listTransactions = async (params = {}) => {
  const response = await api.get('/transactions', { params });
  return response?.data?.data || { transactions: [], stats: { receitas: 0, despesas: 0, saldo: 0 } };
};

export const createTransaction = async (payload) => {
  const response = await api.post('/transactions', payload);
  return response?.data?.data;
};

export const deleteTransaction = async (transactionId) => {
  const response = await api.delete(`/transactions/${transactionId}`);
  return response?.data;
};
