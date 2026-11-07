import API from './axiosInstance';

// R4: Get all expenses with optional filtering parameters
export const getExpenses = async (params = {}) => {
  const { data } = await API.get('/transactions/expenses', { params });
  return data;
};

// R4: Get single expense details by ID
export const getExpenseById = async (id) => {
  const { data } = await API.get(`/transactions/expenses/${id}`);
  return data;
};

// R4: Create new daily expense transaction
export const createExpense = async (expenseData) => {
  const { data } = await API.post('/transactions/expenses', expenseData);
  return data;
};

// R4: Update existing expense transaction
export const updateExpense = async (id, expenseData) => {
  const { data } = await API.put(`/transactions/expenses/${id}`, expenseData);
  return data;
};

// R4: Delete expense transaction and restore balance
export const deleteExpense = async (id) => {
  const { data } = await API.delete(`/transactions/expenses/${id}`);
  return data;
};

// Category helpers
export const getCategories = async (params = {}) => {
  const { data } = await API.get('/categories', { params });
  return data;
};

export const createCategory = async (categoryData) => {
  const { data } = await API.post('/categories', categoryData);
  return data;
};
