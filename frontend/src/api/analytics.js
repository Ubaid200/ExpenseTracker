import API from './auth';

export const getExpenseSummary = async (params = {}) => {
  const response = await API.get('/analytics/summary', { params });
  return response.data;
};

export const getCategoryBreakdown = async (params = {}) => {
  const response = await API.get('/analytics/category-breakdown', { params });
  return response.data;
};

export const getMonthlyTrends = async (params = {}) => {
  const response = await API.get('/analytics/trends', { params });
  return response.data;
};
