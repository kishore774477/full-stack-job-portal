import axios from 'axios';

// In development Vite proxies /api to the backend; override with VITE_API_URL if needed
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errorMessage = (err) =>
  err?.response?.data?.message || (err?.request ? 'Cannot reach the server. Is the backend running?' : 'Something went wrong');

export default api;
