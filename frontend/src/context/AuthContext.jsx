import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('ep_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem('ep_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      localStorage.setItem('ep_user', JSON.stringify(data.user));
    } catch (_err) {
      setUser(null);
      localStorage.removeItem('ep_token');
      localStorage.removeItem('ep_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('ep_token', data.token);
    localStorage.setItem('ep_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('ep_token', data.token);
    localStorage.setItem('ep_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_err) {
      /* ignore — clear client state regardless */
    }
    localStorage.removeItem('ep_token');
    localStorage.removeItem('ep_user');
    setUser(null);
  };

  const ORGANIZER_ROLES = ['super_admin', 'org_admin', 'event_manager', 'volunteer', 'judge', 'sponsor_viewer'];
  const isOrganizer = !!user && ORGANIZER_ROLES.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshMe, isOrganizer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
