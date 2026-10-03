import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        apiFetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
          .then(async (res) => {
            if (!res.ok) throw new Error('Invalid session');
            const account = await res.json();
            setUser({ ...decoded, ...account, id: account._id || decoded.id });
          })
          .catch(() => {
            localStorage.removeItem('token');
            setUser(null);
          })
          .finally(() => setAuthLoading(false));
      } else {
        localStorage.removeItem('token');
        setAuthLoading(false);
      }
    } else {
      setAuthLoading(false);
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = parseJwt(token);
    setUser(decoded);
    setAuthLoading(false);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const decoded = parseJwt(token);
    const res = await apiFetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      logout();
      return null;
    }
    const account = await res.json();
    const nextUser = { ...decoded, ...account, id: account._id || decoded?.id };
    setUser(nextUser);
    return nextUser;
  }, [logout]);

  const value = {
    user,
    login,
    logout,
    refreshUser,
    authLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    tier: user?.tier || 'free',
    tierExpiry: user?.tierExpiry
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
