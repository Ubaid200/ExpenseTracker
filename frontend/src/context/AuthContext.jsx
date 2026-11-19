import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextInstance';
import { loginUser, registerUser, getCurrentUser } from '../api/auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // Sync / verify user session on mount
  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        // If it's a demo session, keep it without failing
        if (token.startsWith('demo-')) {
          setLoading(false);
          return;
        }

        try {
          const res = await getCurrentUser();
          if (res?.data) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err?.response?.data?.message || err.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();
  }, [token, logout]);

  const login = async (credentials) => {
    try {
      const res = await loginUser(credentials);
      if (res.token) {
        localStorage.setItem('token', res.token);
        setToken(res.token);
      }
      if (res.user) {
        localStorage.setItem('user', JSON.stringify(res.user));
        setUser(res.user);
      }
      return res;
    } catch (err) {
      // If backend is offline or unreachable and demo credentials are used, activate demo mode
      if (credentials.email === 'demo@example.com') {
        const demoUser = { id: 'demo-123', name: 'Alex Johnson', email: 'demo@example.com' };
        const demoToken = 'demo-jwt-token-active';
        localStorage.setItem('token', demoToken);
        localStorage.setItem('user', JSON.stringify(demoUser));
        setToken(demoToken);
        setUser(demoUser);
        return { success: true, message: 'Demo mode active! Welcome.', user: demoUser, token: demoToken };
      }
      throw err;
    }
  };

  const register = async (userData) => {
    const res = await registerUser(userData);
    if (res.token) {
      localStorage.setItem('token', res.token);
      setToken(res.token);
    }
    if (res.user) {
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
