import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true, // ✅ Important pour Sanctum
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token Bearer si disponible
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qcm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fonction pour obtenir le CSRF cookie avant l'authentification
export async function getCsrfCookie() {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const sanctumURL = baseURL.replace('/api', '/sanctum/csrf-cookie');
  
  try {
    await axios.get(sanctumURL, { withCredentials: true });
  } catch (error) {
    console.error('Failed to get CSRF cookie:', error);
  }
}

export function getApiError(error) {
  if (error?.response?.data?.message) return error.response.data.message;
  const errors = error?.response?.data?.errors;
  if (errors) return Object.values(errors).flat().join('\n');
  return 'Une erreur est survenue.';
}

export default api;
