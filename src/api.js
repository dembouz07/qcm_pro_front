import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

// Fonction pour obtenir le CSRF cookie avant l'authentification
export async function getCsrfCookie() {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const sanctumURL = `${baseURL.replace(/\/api\/?$/, '')}/sanctum/csrf-cookie`;

  return axios.get(sanctumURL, { withCredentials: true, withXSRFToken: true });
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error?.config;

    if (error?.response?.status === 419 && request && !request.__csrfRetried) {
      request.__csrfRetried = true;
      await getCsrfCookie();
      return api(request);
    }

    return Promise.reject(error);
  },
);

export function getApiError(error) {
  if (error?.response?.data?.message) return error.response.data.message;
  const errors = error?.response?.data?.errors;
  if (errors) return Object.values(errors).flat().join('\n');
  return 'Une erreur est survenue.';
}

export default api;
