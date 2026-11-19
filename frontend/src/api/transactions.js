import API from './auth';

export const getTransactions = async (params = {}) => {
  const response = await API.get('/transactions', { params });
  return response.data;
};

export const createTransaction = async (data) => {
  const response = await API.post('/transactions', data);
  return response.data;
};

export const updateTransaction = async (id, data) => {
  const response = await API.put(`/transactions/${id}`, data);
  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await API.delete(`/transactions/${id}`);
  return response.data;
};

export const exportTransactionsCSV = async (params = {}) => {
  const response = await API.get('/transactions/export/csv', {
    params,
    responseType: 'blob',
  });
  return response.data;
};
