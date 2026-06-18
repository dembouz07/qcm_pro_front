import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qcm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiError(error) {
  if (error?.response?.data?.message) return error.response.data.message;
  const errors = error?.response?.data?.errors;
  if (errors) return Object.values(errors).flat().join('\n');
  return 'Une erreur est survenue.';
}

export default api;
