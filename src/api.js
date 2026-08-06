import axios from 'axios';

const configuredApiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const usesVercelSameOriginProxy = typeof window !== 'undefined'
  && window.location.hostname.endsWith('.vercel.app');
const apiBaseURL = usesVercelSameOriginProxy ? '/api' : configuredApiURL;

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

// Fonction pour obtenir le CSRF cookie avant l'authentification
export async function getCsrfCookie() {
  const sanctumURL = `${apiBaseURL.replace(/\/api\/?$/, '')}/sanctum/csrf-cookie`;

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
