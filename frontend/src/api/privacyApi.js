import API from './axiosInstance';

// R3: save balance-masking flag and/or locked sections (pin needed when changing locked sections)
export const updatePrivacy = async (payload) => {
  const { data } = await API.put('/users/privacy', payload);
  return data;
};

// R3: create a PIN (pin) or change it (pin + currentPin)
export const setPin = async (pin, currentPin) => {
  const { data } = await API.post('/users/pin', { pin, ...(currentPin ? { currentPin } : {}) });
  return data;
};

// R3: remove the PIN (and all section locks)
export const removePin = async (pin) => {
  const { data } = await API.delete('/users/pin', { data: { pin } });
  return data;
};

// R3: verify the PIN -> { valid, unlockToken, expiresIn }
export const verifyPin = async (pin) => {
  const { data } = await API.post('/users/verify-pin', { pin });
  return data;
};
