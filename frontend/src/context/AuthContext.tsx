import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService, subscriptionsService } from '../services/supabaseService';
import supabase from '../services/supabase';

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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial session restoration and auth listener
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const session = await authService.getSession();
        if (session?.user && isMounted) {
          const playxUser = await authService.getUserProfile(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.name || '',
            session.user.user_metadata?.role || 'user'
          );
          setUser(playxUser);
          setToken(session.access_token);
          localStorage.setItem('playx_token', session.access_token);
        } else if (isMounted) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('playx_token');
        }
      } catch (err) {
        console.error('Failed to restore Supabase session:', err);
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for real-time Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const playxUser = await authService.getUserProfile(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata?.name || '',
            session.user.user_metadata?.role || 'user'
          );
          if (isMounted) {
            setUser(playxUser);
            setToken(session.access_token);
            localStorage.setItem('playx_token', session.access_token);
          }
        } catch (e) {
          console.error('Error synchronizing auth state change:', e);
        }
      } else {
        if (isMounted) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('playx_token');
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { token: newToken, user: userData } = await authService.signIn(email, password);
    setToken(newToken);
    setUser(userData);
    if (newToken) {
      localStorage.setItem('playx_token', newToken);
    }
  };

  const register = async (name: string, email: string, password: string, role = 'user') => {
    const { token: newToken, user: userData } = await authService.signUp(name, email, password, role);
    setToken(newToken);
    setUser(userData);
    if (newToken) {
      localStorage.setItem('playx_token', newToken);
    }
  };

  const registerWithoutLogin = async (name: string, email: string, password: string, _confirmPassword?: string, role = 'user') => {
    return await authService.signUp(name, email, password, role);
  };

  const loginWithSocial = async (provider: 'google' | 'apple', email?: string, name?: string) => {
    if (email) {
      // If mock/demo email provided in UI, handle via Supabase Auth
      return login(email, 'PlayX@2026');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider === 'apple' ? 'apple' : 'google'
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await authService.signOut();
    localStorage.removeItem('playx_token');
    setToken(null);
    setUser(null);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const updateProfile = async (data: { name?: string; avatar?: string; password?: string; bio?: string }) => {
    if (!user) throw new Error('Not logged in');
    const updated = await authService.updateProfile(user.id, data);
    setUser(prev => prev ? { ...prev, name: updated.name || prev.name, avatar: updated.avatar || prev.avatar } : null);
    return updated;
  };

  const upgradeSubscription = async (planId = 'sub_premium') => {
    if (!user) throw new Error('Not logged in');
    const res = await subscriptionsService.upgradeSubscription(user.id, planId);
    setUser(prev => prev ? { ...prev, subscription: res.subscription } : null);
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
