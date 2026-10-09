import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<any>;
  registerWithoutLogin: (name: string, email: string, password: string, confirmPassword?: string, role?: string) => Promise<any>;
  resendVerification: (email: string) => Promise<any>;
  verifyEmail: (verificationToken: string) => Promise<any>;
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
    const storedToken = localStorage.getItem('playx_token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data) {
        setUser(res.data);
        setToken(storedToken);
      }
    } catch (err: any) {
      console.warn('Failed to restore user session:', err?.response?.data || err?.message);
      // Only clear if 401 Unauthorized, not temporary network error
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('playx_token');
        setUser(null);
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    if (newToken) {
      localStorage.setItem('playx_token', newToken);
      setToken(newToken);
    }
    if (userData) {
      setUser(userData);
    }
  };

  const register = async (name: string, email: string, password: string, role = 'user') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { token: newToken, user: userData } = res.data;
    if (newToken) {
      localStorage.setItem('playx_token', newToken);
      setToken(newToken);
    }
    if (userData) {
      setUser(userData);
    }
    return res.data;
  };

  const registerWithoutLogin = async (name: string, email: string, password: string, confirmPassword?: string, role = 'user') => {
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
      confirmPassword: confirmPassword || password,
      role
    });
    return res.data;
  };

  const resendVerification = async (email: string) => {
    const res = await api.post('/auth/resend-verification', { email });
    return res.data;
  };

  const verifyEmail = async (verificationToken: string) => {
    const res = await api.get(`/auth/verify-email?token=${encodeURIComponent(verificationToken)}`);
    const { token: newToken, user: userData } = res.data;
    if (newToken) {
      localStorage.setItem('playx_token', newToken);
      setToken(newToken);
    }
    if (userData) {
      setUser(userData);
    }
    return res.data;
  };

  const loginWithSocial = async (provider: 'google' | 'apple', email?: string, name?: string) => {
    const res = await api.post('/auth/social-login', {
      provider,
      email: email || 'guest@playx.music',
      name: name || 'PlayX Listener'
    });
    const { token: newToken, user: userData } = res.data;
    if (newToken) {
      localStorage.setItem('playx_token', newToken);
      setToken(newToken);
    }
    if (userData) {
      setUser(userData);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (ignored) {}
    localStorage.removeItem('playx_token');
    setToken(null);
    setUser(null);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/image', formData);
      if (res.data?.url) return res.data.url;
    } catch (e) {
      console.warn('Backend image upload failed, falling back to Data URL preview:', e);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const updateProfile = async (data: { name?: string; avatar?: string; password?: string; bio?: string }) => {
    if (!user) throw new Error('Not logged in');
    const res = await api.put('/auth/profile', data);
    if (res.data?.user) {
      setUser(prev => prev ? { ...prev, ...res.data.user } : null);
    } else {
      setUser(prev => prev ? { ...prev, name: data.name || prev.name, avatar: data.avatar || prev.avatar } : null);
    }
    return res.data;
  };

  const upgradeSubscription = async (planId = 'sub_premium') => {
    if (!user) throw new Error('Not logged in');
    try {
      const res = await api.post('/subscriptions/upgrade', { plan_id: planId });
      setUser(prev => prev ? { ...prev, subscription: res.data?.subscription || 'Premium' } : null);
    } catch {
      setUser(prev => prev ? { ...prev, subscription: 'Premium' } : null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        registerWithoutLogin,
        resendVerification,
        verifyEmail,
        loginWithSocial,
        logout,
        updateProfile,
        uploadAvatar,
        upgradeSubscription
      }}
    >
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
