import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  registerWithoutLogin: (name: string, email: string, password: string, confirmPassword?: string, role?: string) => Promise<any>;
  loginWithSocial: (provider: 'google' | 'apple', email?: string, name?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; avatar?: string; password?: string; bio?: string }) => Promise<any>;
  uploadAvatar: (file: File) => Promise<string>;
  upgradeSubscription: (planId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('playx_token'));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (token) {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('playx_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const register = async (name: string, email: string, password: string, role = 'user') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('playx_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const registerWithoutLogin = async (name: string, email: string, password: string, confirmPassword?: string, role = 'user') => {
    const res = await api.post('/auth/register', { name, email, password, confirmPassword: confirmPassword || password, role });
    return res.data;
  };

  const loginWithSocial = async (provider: 'google' | 'apple', email?: string, name?: string) => {
    const res = await api.post('/auth/social-login', { provider, email, name });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('playx_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('playx_token');
    setToken(null);
    setUser(null);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.url;
  };

  const updateProfile = async (data: { name?: string; avatar?: string; password?: string; bio?: string }) => {
    const res = await api.put('/auth/profile', data);
    if (res.data?.token) {
      localStorage.setItem('playx_token', res.data.token);
      setToken(res.data.token);
    }
    if (res.data?.user) {
      setUser((prev) => ({ ...prev, ...res.data.user }));
    }
    await fetchCurrentUser();
    return res.data;
  };

  const upgradeSubscription = async (planId = 'sub_premium') => {
    const res = await api.post('/subscriptions/upgrade', { plan_id: planId });
    if (user) {
      setUser({ ...user, subscription: res.data.subscription });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, registerWithoutLogin, loginWithSocial, logout, updateProfile, uploadAvatar, upgradeSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
