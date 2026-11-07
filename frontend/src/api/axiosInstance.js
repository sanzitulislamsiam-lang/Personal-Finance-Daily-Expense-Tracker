import axios from 'axios';
import { getUnlock, clearUnlock } from '../utils/pinSession';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Interceptor to attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token, _id } = JSON.parse(userInfo);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // R3: attach the PIN unlock token (if the user unlocked a section recently)
    const unlock = getUnlock(_id);
    if (unlock) {
      config.headers['x-pin-token'] = unlock.token;
    }
  }
  return config;
});

// R3: if the server says a section is PIN-locked, forget the old unlock and tell the app
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 423 && error.response?.data?.code === 'PIN_REQUIRED') {
      clearUnlock();
      window.dispatchEvent(new Event('pin-required'));
    }
    return Promise.reject(error);
  }
);

export default API;
