import API from './auth';

export const getCategories = async () => {
  const response = await API.get('/categories');
  return response.data;
};

export const createCategory = async (data) => {
  const response = await API.post('/categories', data);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await API.delete(`/categories/${id}`);
  return response.data;
};
