import React, { useState } from 'react';
import { User as UserIcon, Mail, Shield, Crown, Key, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateProfile({ name, avatar, password: password || undefined });
      setMessage('Profile updated successfully!');
      setPassword('');
    } catch (err) {
      console.error(err);
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8 pb-20 select-none max-w-3xl mx-auto">
      {/* User Header */}
      <div className="flex items-center gap-6 bg-gradient-to-r from-spotify-card via-black to-spotify-card p-6 rounded-3xl border border-spotify-hover/40 shadow-2xl">
        <img
          src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
          alt={user?.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-spotify-green/40 shadow-xl"
        />
        <div className="space-y-1">
          <span className="px-3 py-0.5 rounded-full text-[10px] uppercase font-black bg-spotify-green/20 text-spotify-green">
            {user?.role} Account
          </span>
          <h1 className="text-3xl font-black text-white">{user?.name}</h1>
          <p className="text-xs text-spotify-subtext">{user?.email}</p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-spotify-green/20 border border-spotify-green/40 text-spotify-green text-xs font-bold">
          {message}
        </div>
      )}

      {/* Edit Form */}
      <div className="glass-panel p-8 rounded-3xl border border-spotify-hover/40 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">Account Settings</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-spotify-subtext mb-2">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/60 border border-spotify-hover rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-spotify-green transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-spotify-subtext mb-2">Avatar URL</label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full bg-black/60 border border-spotify-hover rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-spotify-green transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-spotify-subtext mb-2">New Password (Optional)</label>
            <input
              type="password"
              placeholder="Leave blank to keep current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/60 border border-spotify-hover rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-spotify-green transition-colors"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-full bg-spotify-green text-black font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-spotify-green/20"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
