import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Lock, Mail, Shield, Mic2, User, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login with demo account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-spotify-card border border-spotify-hover rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-spotify-green flex items-center justify-center mx-auto shadow-lg shadow-spotify-green/20">
            <span className="font-black text-black text-2xl tracking-tighter">X</span>
          </div>
          <h1 className="text-2xl font-black text-white">Log in to PLAYX</h1>
          <p className="text-xs text-spotify-subtext">Access your music library and custom playlists.</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-spotify-subtext mb-1">Email address</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/60 border border-spotify-hover rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-spotify-green transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-spotify-subtext mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/60 border border-spotify-hover rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-spotify-green transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-spotify-green text-black font-extrabold text-sm hover:scale-105 transition-transform shadow-lg shadow-spotify-green/20"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Quick Demo Accounts */}
        <div className="border-t border-spotify-hover/40 pt-4 space-y-2">
          <span className="text-[11px] font-bold text-spotify-subtext uppercase tracking-wider block text-center">
            Quick Demo Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemo('admin@example.com', 'AdminPass123')}
              className="p-2.5 rounded-xl bg-black/50 border border-spotify-hover hover:border-spotify-green text-left flex items-center gap-2 transition-colors"
            >
              <Shield className="w-4 h-4 text-spotify-green" />
              <div>
                <p className="text-xs font-bold text-white">Admin</p>
                <p className="text-[10px] text-spotify-subtext">Full system access</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickDemo('artist@example.com', 'ArtistPass123')}
              className="p-2.5 rounded-xl bg-black/50 border border-spotify-hover hover:border-purple-400 text-left flex items-center gap-2 transition-colors"
            >
              <Mic2 className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-xs font-bold text-white">Artist</p>
                <p className="text-[10px] text-spotify-subtext">Publish & stats</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickDemo('user@example.com', 'UserPass123')}
              className="p-2.5 rounded-xl bg-black/50 border border-spotify-hover hover:border-sky-400 text-left flex items-center gap-2 transition-colors"
            >
              <User className="w-4 h-4 text-sky-400" />
              <div>
                <p className="text-xs font-bold text-white">Free User</p>
                <p className="text-[10px] text-spotify-subtext">Standard plan</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickDemo('premium@example.com', 'PremiumPass123')}
              className="p-2.5 rounded-xl bg-black/50 border border-spotify-hover hover:border-amber-400 text-left flex items-center gap-2 transition-colors"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-bold text-white">Premium</p>
                <p className="text-[10px] text-spotify-subtext">Unlimited listening</p>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-spotify-subtext">
            Don't have an account?{' '}
            <NavLink to="/register" className="text-white font-bold hover:underline">
              Sign up for PLAYX
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
