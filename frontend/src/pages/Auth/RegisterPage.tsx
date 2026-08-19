import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'artist'>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Try a different email.');
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
          <h1 className="text-2xl font-black text-white">Sign up for PLAYX</h1>
          <p className="text-xs text-spotify-subtext">Create an account to start streaming music.</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-spotify-subtext mb-1">What's your name?</label>
            <input
              type="text"
              required
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/60 border border-spotify-hover rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-spotify-green transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-spotify-subtext mb-1">What's your email?</label>
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
            <label className="block text-xs font-bold uppercase tracking-wider text-spotify-subtext mb-1">Create a password</label>
            <input
              type="password"
              required
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/60 border border-spotify-hover rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-spotify-green transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-spotify-subtext mb-1">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  role === 'user'
                    ? 'bg-spotify-green/20 border-spotify-green text-spotify-green'
                    : 'bg-black/40 border-spotify-hover text-spotify-subtext'
                }`}
              >
                Music Listener
              </button>
              <button
                type="button"
                onClick={() => setRole('artist')}
                className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  role === 'artist'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-400'
                    : 'bg-black/40 border-spotify-hover text-spotify-subtext'
                }`}
              >
                Artist / Creator
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-spotify-green text-black font-extrabold text-sm hover:scale-105 transition-transform shadow-lg shadow-spotify-green/20"
          >
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-spotify-subtext">
            Already have an account?{' '}
            <NavLink to="/login" className="text-white font-bold hover:underline">
              Log in
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
