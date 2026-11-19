import API from './auth';

export const getRecurringTransactions = async () => {
  const response = await API.get('/recurring');
  return response.data;
};

export const createRecurringTransaction = async (data) => {
  const response = await API.post('/recurring', data);
  return response.data;
};

export const updateRecurringTransaction = async (id, data) => {
  const response = await API.put(`/recurring/${id}`, data);
  return response.data;
};

export const deleteRecurringTransaction = async (id) => {
  const response = await API.delete(`/recurring/${id}`);
  return response.data;
};
