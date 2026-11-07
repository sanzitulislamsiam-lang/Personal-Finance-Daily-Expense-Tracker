import API from './axiosInstance';

// ==========================================
// FEATURE R4: EXPENSE LOGGING
// ==========================================

// Get all expenses with optional filtering parameters
export const getExpenses = async (params = {}) => {
  const { data } = await API.get('/transactions/expenses', { params });
  return data;
};

// Get single expense details by ID
export const getExpenseById = async (id) => {
  const { data } = await API.get(`/transactions/expenses/${id}`);
  return data;
};

// Create new daily expense transaction
export const createExpense = async (expenseData) => {
  const { data } = await API.post('/transactions/expenses', expenseData);
  return data;
};

// Update existing expense transaction
export const updateExpense = async (id, expenseData) => {
  const { data } = await API.put(`/transactions/expenses/${id}`, expenseData);
  return data;
};

// Delete expense transaction and restore balance
export const deleteExpense = async (id) => {
  const { data } = await API.delete(`/transactions/expenses/${id}`);
  return data;
};

// ==========================================
// FEATURE R5: INCOME LOGGING
// ==========================================

// Get all income transactions with optional filtering parameters
export const getIncomes = async (params = {}) => {
  const { data } = await API.get('/transactions/incomes', { params });
  return data;
};

// Get single income details by ID
export const getIncomeById = async (id) => {
  const { data } = await API.get(`/transactions/incomes/${id}`);
  return data;
};

// Create new income transaction and credit account balance
export const createIncome = async (incomeData) => {
  const { data } = await API.post('/transactions/incomes', incomeData);
  return data;
};

// Update existing income transaction and reconcile balances
export const updateIncome = async (id, incomeData) => {
  const { data } = await API.put(`/transactions/incomes/${id}`, incomeData);
  return data;
};

// Delete income transaction and reverse deposit from balance
export const deleteIncome = async (id) => {
  const { data } = await API.delete(`/transactions/incomes/${id}`);
  return data;
};

// ==========================================
// CATEGORY HELPERS
// ==========================================
export const getCategories = async (params = {}) => {
  const { data } = await API.get('/categories', { params });
  return data;
};

export const createCategory = async (categoryData) => {
  const { data } = await API.post('/categories', categoryData);
  return data;
};
