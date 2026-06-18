import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { getCsrfCookie } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    const token = localStorage.getItem('qcm_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch {
      localStorage.removeItem('qcm_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function login(payload) {
    // ✅ Récupérer le CSRF cookie avant l'authentification
    await getCsrfCookie();
    
    const response = await api.post('/auth/login', payload);
    localStorage.setItem('qcm_token', response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }

  async function register(payload) {
    // ✅ Récupérer le CSRF cookie avant l'enregistrement
    await getCsrfCookie();
    
    const response = await api.post('/auth/register', payload);
    localStorage.setItem('qcm_token', response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('qcm_token');
      setUser(null);
    }
  }

  const value = useMemo(() => ({ user, loading, login, register, logout, setUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
