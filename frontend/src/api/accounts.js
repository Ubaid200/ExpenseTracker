import API from './auth';

export const getAccounts = async () => {
  const response = await API.get('/accounts');
  return response.data;
};

export const createAccount = async (data) => {
  const response = await API.post('/accounts', data);
  return response.data;
};

export const updateAccount = async (id, data) => {
  const response = await API.put(`/accounts/${id}`, data);
  return response.data;
};

export const deleteAccount = async (id) => {
  const response = await API.delete(`/accounts/${id}`);
  return response.data;
};
