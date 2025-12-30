import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Categories
export const getCategories = () => API.get('/categories');
export const createCategory = (data) => API.post('/categories', data);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

// Transactions
export const getTransactions = (params) => API.get('/transactions', { params });
export const createTransaction = (data) => API.post('/transactions', data);
export const updateTransaction = (id, data) => API.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => API.delete(`/transactions/${id}`);

// Budgets
export const getBudgets = (params) => API.get('/budgets', { params });
export const createBudget = (data) => API.post('/budgets', data);
export const updateBudget = (id, data) => API.put(`/budgets/${id}`, data);
export const deleteBudget = (id) => API.delete(`/budgets/${id}`);

// Savings Goals
export const getSavingsGoals = () => API.get('/savings-goals');
export const createSavingsGoal = (data) => API.post('/savings-goals', data);
export const updateSavingsGoal = (id, data) => API.put(`/savings-goals/${id}`, data);
export const deleteSavingsGoal = (id) => API.delete(`/savings-goals/${id}`);

// Dashboard & Analytics
export const getDashboardSummary = (month) => API.get('/dashboard/summary', { params: { month } });
export const getSpendingTrends = (months) => API.get('/analytics/trends', { params: { months } });

export default API;
