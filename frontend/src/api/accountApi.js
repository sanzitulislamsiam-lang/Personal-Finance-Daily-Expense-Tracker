import API from './axiosInstance';

// R2: Get all accounts and aggregated balance summary
export const getAccounts = async () => {
  const { data } = await API.get('/accounts');
  return data;
};

// R2: Get single account details
export const getAccountById = async (id) => {
  const { data } = await API.get(`/accounts/${id}`);
  return data;
};

// R2: Create a new account
export const createAccount = async (accountData) => {
  const { data } = await API.post('/accounts', accountData);
  return data;
};

// R2: Update existing account
export const updateAccount = async (id, accountData) => {
  const { data } = await API.put(`/accounts/${id}`, accountData);
  return data;
};

// R2: Delete account
export const deleteAccount = async (id) => {
  const { data } = await API.delete(`/accounts/${id}`);
  return data;
};
