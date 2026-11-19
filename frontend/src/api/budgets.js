import API from './auth';

export const getBudgets = async (params = {}) => {
  const response = await API.get('/budgets', { params });
  return response.data;
};

export const saveBudget = async (data) => {
  const response = await API.post('/budgets', data);
  return response.data;
};

export const updateBudget = async (id, data) => {
  const response = await API.put(`/budgets/${id}`, data);
  return response.data;
};

export const deleteBudget = async (id) => {
  const response = await API.delete(`/budgets/${id}`);
  return response.data;
};
