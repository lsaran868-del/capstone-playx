import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, Music, Mic2, ListMusic, Trash2, Shield, Play } from 'lucide-react';
import api from '../services/api';
import { User, Song, AdminStats } from '../types';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'songs'>('users');
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, songsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/songs')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setSongs(songsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSong = async (songId: string) => {
    if (!window.confirm('Delete this song as Admin?')) return;
    try {
      await api.delete(`/admin/songs/${songId}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 pb-20 select-none">
      {/* Header */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-900/60 via-spotify-card to-black p-6 rounded-3xl border border-spotify-green/30 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-spotify-green/20 text-spotify-green flex items-center justify-center">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white">System Admin Control Center</h1>
          <p className="text-xs text-spotify-subtext">Manage overall user access, artist accounts, content moderation, and platform metrics.</p>
        </div>
      </div>

      {/* Global Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-spotify-hover/40 text-center">
          <Users className="w-5 h-5 text-sky-400 mx-auto mb-2" />
          <span className="text-2xl font-black text-white">{stats?.totalUsers || 0}</span>
          <p className="text-[11px] text-spotify-subtext font-bold uppercase tracking-wider mt-1">Users</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-spotify-hover/40 text-center">
          <Mic2 className="w-5 h-5 text-purple-400 mx-auto mb-2" />
          <span className="text-2xl font-black text-white">{stats?.totalArtists || 0}</span>
          <p className="text-[11px] text-spotify-subtext font-bold uppercase tracking-wider mt-1">Artists</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-spotify-hover/40 text-center">
          <Music className="w-5 h-5 text-spotify-green mx-auto mb-2" />
          <span className="text-2xl font-black text-white">{stats?.totalSongs || 0}</span>
          <p className="text-[11px] text-spotify-subtext font-bold uppercase tracking-wider mt-1">Songs</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-spotify-hover/40 text-center">
          <ListMusic className="w-5 h-5 text-amber-400 mx-auto mb-2" />
          <span className="text-2xl font-black text-white">{stats?.totalPlaylists || 0}</span>
          <p className="text-[11px] text-spotify-subtext font-bold uppercase tracking-wider mt-1">Playlists</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-spotify-hover/40 text-center">
          <Play className="w-5 h-5 text-rose-400 mx-auto mb-2" />
          <span className="text-2xl font-black text-white">{(stats?.totalPlays || 0).toLocaleString()}</span>
          <p className="text-[11px] text-spotify-subtext font-bold uppercase tracking-wider mt-1">Streams</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-spotify-hover/40 pb-4">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-colors ${
            activeTab === 'users' ? 'bg-white text-black' : 'bg-spotify-card text-spotify-subtext hover:text-white'
          }`}
        >
          Manage Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('songs')}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-colors ${
            activeTab === 'songs' ? 'bg-white text-black' : 'bg-spotify-card text-spotify-subtext hover:text-white'
          }`}
        >
          Manage Songs ({songs.length})
        </button>
      </div>

      {/* User Management Table */}
      {activeTab === 'users' && (
        <div className="bg-spotify-card/40 rounded-2xl border border-spotify-hover/40 overflow-hidden">
          <table className="w-full text-left text-sm text-spotify-subtext">
            <thead className="bg-spotify-card text-xs font-bold uppercase tracking-wider text-white border-b border-spotify-hover/40">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-spotify-hover/30">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-spotify-hover/40 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} className="w-9 h-9 rounded-full object-cover" />
                    <span className="font-bold text-white">{u.name}</span>
                  </td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-black/60 border border-spotify-hover text-xs rounded px-2.5 py-1 text-white font-bold"
                    >
                      <option value="user">user</option>
                      <option value="artist">artist</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Song Management Table */}
      {activeTab === 'songs' && (
        <div className="bg-spotify-card/40 rounded-2xl border border-spotify-hover/40 overflow-hidden">
          <table className="w-full text-left text-sm text-spotify-subtext">
            <thead className="bg-spotify-card text-xs font-bold uppercase tracking-wider text-white border-b border-spotify-hover/40">
              <tr>
                <th className="p-4">Song Title</th>
                <th className="p-4">Artist</th>
                <th className="p-4">Plays</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-spotify-hover/30">
              {songs.map((s) => (
                <tr key={s.id} className="hover:bg-spotify-hover/40 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img src={s.cover_art || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=80&q=80'} className="w-9 h-9 rounded object-cover" />
                    <span className="font-bold text-white">{s.title}</span>
                  </td>
                  <td className="p-4">{s.artist_name || 'Artist'}</td>
                  <td className="p-4">{(s.plays_count || 0).toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteSong(s.id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                      title="Delete Song"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
