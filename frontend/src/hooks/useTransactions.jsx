// =============================================================================
// HOOKS/USETRANSACTIONS.JSX - FRONTEND - Hook para gestão financeira
// =============================================================================
import { useState, useCallback } from 'react';
import api from '../config/axios';

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ receitas: 0, despesas: 0, saldo: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/transactions', { params });
      setTransactions(response.data.data.transactions);
      setStats(response.data.data.stats);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransaction = async (transactionData) => {
    try {
      const response = await api.post('/transactions', transactionData);
      setTransactions(prev => [response.data.data, ...prev]);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t._id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  };

  return { transactions, stats, loading, error, fetchTransactions, createTransaction, deleteTransaction };
}
