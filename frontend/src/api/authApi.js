import API from './axiosInstance';

// R1: Fetch user profile
export const getProfile = async () => {
  const { data } = await API.get('/users/profile');
  return data;
};

// R1 & R3: Update user profile, currency, avatar, PIN settings
export const updateProfile = async (profileData) => {
  const { data } = await API.put('/users/profile', profileData);
  return data;
};

// Auth
export const login = async (credentials) => {
  const { data } = await API.post('/auth/login', credentials);
  return data;
};

export const register = async (userData) => {
  const { data } = await API.post('/auth/register', userData);
  return data;
};
