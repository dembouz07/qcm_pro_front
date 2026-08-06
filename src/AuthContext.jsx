import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { getCsrfCookie } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Nettoyage unique de l'ancien jeton navigateur après migration vers la session HttpOnly.
    localStorage.removeItem('qcm_token');
    loadUser();
  }, []);

  async function login(payload) {
    // ✅ Récupérer le CSRF cookie avant l'authentification
    await getCsrfCookie();
    
    const response = await api.post('/auth/login', payload);
    setUser(response.data.user);
    return response.data.user;
  }

  async function register(payload) {
    // ✅ Récupérer le CSRF cookie avant l'enregistrement
    await getCsrfCookie();
    
    const response = await api.post('/auth/register', payload);
    setUser(response.data.user);
    return response.data.user;
  }

  async function registerAdmin(payload) {
    await getCsrfCookie();
    const response = await api.post('/auth/register-admin', payload);
    setUser(response.data.user);
    return response.data.user;
  }

  async function registerEnterprise(payload) {
    await getCsrfCookie();
    const response = await api.post('/auth/register-enterprise', payload);
    setUser(response.data.user);
    return response.data.user;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      if (error?.response?.status !== 419) throw error;
      await getCsrfCookie();
      await api.post('/auth/logout');
    }
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, register, registerAdmin, registerEnterprise, logout, setUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
