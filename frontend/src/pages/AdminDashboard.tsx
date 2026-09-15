import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, Music, Mic2, ListMusic, Trash2, Disc, Play, Pause, Globe, Lock, Upload, HardDrive, Camera } from 'lucide-react';
import api from '../services/api';
import { User, Song, Artist, Album, Playlist, AdminStats } from '../types';
import UploadSongModal from '../components/Modals/UploadSongModal';
import EditArtistImageModal from '../components/Modals/EditArtistImageModal';
import { usePlayer } from '../context/PlayerContext';

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const AdminDashboard: React.FC = () => {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'artists' | 'songs' | 'albums' | 'playlists'>('users');
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, artistsRes, songsRes, albumsRes, playlistsRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/artists'),
        api.get('/admin/songs'),
        api.get('/admin/albums'),
        api.get('/admin/playlists')
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data || []);
      if (artistsRes.status === 'fulfilled') setArtists(artistsRes.value.data || []);
      if (songsRes.status === 'fulfilled') setSongs(songsRes.value.data || []);
      if (albumsRes.status === 'fulfilled') setAlbums(albumsRes.value.data || []);
      if (playlistsRes.status === 'fulfilled') setPlaylists(playlistsRes.value.data || []);
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
    if (!window.confirm('Delete this song from the platform?')) return;
    try {
      await api.delete(`/admin/songs/${songId}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!window.confirm('Delete this playlist as Admin?')) return;
    try {
      await api.delete(`/admin/playlists/${playlistId}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-muse-subtext font-medium">Loading admin center...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 pb-24 select-none max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-gradient-to-r from-purple-900/60 via-pink-900/20 to-muse-card p-6 md:p-8 rounded-3xl border border-pink-500/30 shadow-2xl backdrop-blur-xl">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 shrink-0">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">PlayX Admin Control Center</h1>
          <p className="text-xs text-muse-subtext mt-1">
            Oversee registered users, verified artists, catalogue tracks, albums, and playlists.
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shrink-0 self-start sm:self-center"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Song</span>
        </button>
      </div>

      {/* Global Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-muse-border/40 text-center">
          <Users className="w-5 h-5 text-sky-400 mx-auto mb-1.5" />
          <span className="text-2xl font-black text-white">{stats?.totalUsers || users.length}</span>
          <p className="text-[10px] text-muse-subtext font-bold uppercase tracking-wider mt-0.5">Users</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-muse-border/40 text-center">
          <Mic2 className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
          <span className="text-2xl font-black text-white">{stats?.totalArtists || artists.length}</span>
          <p className="text-[10px] text-muse-subtext font-bold uppercase tracking-wider mt-0.5">Artists</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-muse-border/40 text-center">
          <Music className="w-5 h-5 text-pink-400 mx-auto mb-1.5" />
          <span className="text-2xl font-black text-white">{stats?.totalSongs || songs.length}</span>
          <p className="text-[10px] text-muse-subtext font-bold uppercase tracking-wider mt-0.5">Songs</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-muse-border/40 text-center">
          <ListMusic className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
          <span className="text-2xl font-black text-white">{stats?.totalPlaylists || playlists.length}</span>
          <p className="text-[10px] text-muse-subtext font-bold uppercase tracking-wider mt-0.5">Playlists</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-muse-border/40 text-center col-span-2 sm:col-span-1">
          <Play className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
          <span className="text-2xl font-black text-white">{(stats?.totalPlays || 0).toLocaleString()}</span>
          <p className="text-[10px] text-muse-subtext font-bold uppercase tracking-wider mt-0.5">Streams</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-muse-border/30 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
              : 'bg-muse-card/60 border border-muse-border/40 text-muse-subtext hover:text-white'
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('artists')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'artists'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
              : 'bg-muse-card/60 border border-muse-border/40 text-muse-subtext hover:text-white'
          }`}
        >
          Artists ({artists.length})
        </button>
        <button
          onClick={() => setActiveTab('songs')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'songs'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
              : 'bg-muse-card/60 border border-muse-border/40 text-muse-subtext hover:text-white'
          }`}
        >
          Songs ({songs.length})
        </button>
        <button
          onClick={() => setActiveTab('albums')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'albums'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
              : 'bg-muse-card/60 border border-muse-border/40 text-muse-subtext hover:text-white'
          }`}
        >
          Albums ({albums.length})
        </button>
        <button
          onClick={() => setActiveTab('playlists')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'playlists'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
              : 'bg-muse-card/60 border border-muse-border/40 text-muse-subtext hover:text-white'
          }`}
        >
          Playlists ({playlists.length})
        </button>
      </div>

      {/* User Management Table */}
      {activeTab === 'users' && (
        <div className="glass-panel rounded-2xl border border-muse-border/40 overflow-hidden">
          <table className="w-full text-left text-sm text-muse-subtext">
            <thead className="bg-muse-dark/80 text-xs font-bold uppercase tracking-wider text-white border-b border-muse-border/40">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muse-border/20">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muse-hover/30 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                      alt={u.name}
                      className="w-9 h-9 rounded-full object-cover border border-muse-border/40"
                    />
                    <span className="font-semibold text-white">{u.name}</span>
                  </td>
                  <td className="p-4 text-xs font-medium">{u.email}</td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-muse-dark/90 border border-muse-border/60 text-xs rounded-lg px-2.5 py-1 text-white font-semibold focus:outline-none focus:border-pink-500"
                    >
                      <option value="user">user</option>
                      <option value="artist">artist</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
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

      {/* Artist Management Table */}
      {activeTab === 'artists' && (
        <div className="glass-panel rounded-2xl border border-muse-border/40 overflow-hidden">
          <table className="w-full text-left text-sm text-muse-subtext">
            <thead className="bg-muse-dark/80 text-xs font-bold uppercase tracking-wider text-white border-b border-muse-border/40">
              <tr>
                <th className="p-4">Artist</th>
                <th className="p-4">Monthly Listeners</th>
                <th className="p-4">Status</th>
                <th className="p-4">User ID</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muse-border/20">
              {artists.map((art) => (
                <tr key={art.id} className="hover:bg-muse-hover/30 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div
                      onClick={() => setEditingArtist(art)}
                      className="relative group/avatar cursor-pointer shrink-0"
                      title="Click to change photo"
                    >
                      <img
                        src={art.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=80&q=80'}
                        alt={art.name}
                        className="w-10 h-10 rounded-full object-cover border border-muse-border/40 group-hover/avatar:border-pink-500 transition-all"
                      />
                      <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="w-4 h-4 text-pink-300" />
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-white block">{art.name}</span>
                      <button
                        onClick={() => setEditingArtist(art)}
                        className="text-[11px] text-pink-400 hover:text-pink-300 hover:underline inline-flex items-center gap-1 mt-0.5 cursor-pointer font-medium"
                      >
                        <Camera className="w-2.5 h-2.5" />
                        <span>Change Photo</span>
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-medium">{(art.monthly_listeners || 0).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      art.is_verified ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30' : 'bg-white/10 text-white/60'
                    }`}>
                      {art.is_verified ? 'Verified' : 'Standard'}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-mono text-muse-subtext truncate max-w-[120px]">
                    {art.user_id || 'System'}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setEditingArtist(art)}
                      className="px-3 py-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-sm"
                      title="Change Artist Image"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Edit Image</span>
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
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-bold text-white">Song Catalog</h3>
              <p className="text-xs text-muse-subtext">Manage tracks, stream previews, and upload local audio files</p>
            </div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Song</span>
            </button>
          </div>

          <div className="glass-panel rounded-2xl border border-muse-border/40 overflow-hidden">
            <table className="w-full text-left text-sm text-muse-subtext">
              <thead className="bg-muse-dark/80 text-xs font-bold uppercase tracking-wider text-white border-b border-muse-border/40">
                <tr>
                  <th className="p-4 w-12 text-center">Play</th>
                  <th className="p-4">Song Title</th>
                  <th className="p-4">Artist</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Storage Source</th>
                  <th className="p-4">Plays</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muse-border/20">
                {songs.map((s) => {
                  const isThisPlaying = currentSong?.id === s.id && isPlaying;
                  return (
                    <tr key={s.id} className="hover:bg-muse-hover/30 transition-colors">
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            if (currentSong?.id === s.id) {
                              togglePlay();
                            } else {
                              playSong(s, songs);
                            }
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isThisPlaying
                              ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                              : 'bg-muse-hover/60 hover:bg-pink-500 text-white'
                          }`}
                          title={isThisPlaying ? 'Pause Preview' : 'Play Preview'}
                        >
                          {isThisPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-white" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                          )}
                        </button>
                      </td>
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={s.cover_art || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=80&q=80'}
                          alt={s.title}
                          className="w-10 h-10 rounded-lg object-cover border border-muse-border/40 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-white block truncate">{s.title}</span>
                          <span className="text-[11px] text-muse-subtext font-mono truncate block">{s.id}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium text-white/90">{s.artist_name || 'Artist'}</td>
                      <td className="p-4 text-xs font-mono">{formatDuration(s.duration || 180)}</td>
                      <td className="p-4">
                        {s.file_path ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            <HardDrive className="w-3 h-3" />
                            <span>Local Upload</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <Disc className="w-3 h-3" />
                            <span>Catalog Track</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-medium">{(s.plays_count || 0).toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteSong(s.id)}
                          className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                          title="Delete Song from Database & Storage"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Album Management Table */}
      {activeTab === 'albums' && (
        <div className="glass-panel rounded-2xl border border-muse-border/40 overflow-hidden">
          <table className="w-full text-left text-sm text-muse-subtext">
            <thead className="bg-muse-dark/80 text-xs font-bold uppercase tracking-wider text-white border-b border-muse-border/40">
              <tr>
                <th className="p-4">Album</th>
                <th className="p-4">Artist</th>
                <th className="p-4">Release Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muse-border/20">
              {albums.map((alb) => (
                <tr key={alb.id} className="hover:bg-muse-hover/30 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img
                      src={alb.cover_art || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=80&q=80'}
                      alt={alb.title}
                      className="w-9 h-9 rounded-lg object-cover border border-muse-border/40"
                    />
                    <span className="font-semibold text-white">{alb.title}</span>
                  </td>
                  <td className="p-4 text-xs font-medium">{alb.artist_name || 'Artist'}</td>
                  <td className="p-4 text-xs font-medium">{alb.release_year || 2024}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Playlist Management Table */}
      {activeTab === 'playlists' && (
        <div className="glass-panel rounded-2xl border border-muse-border/40 overflow-hidden">
          <table className="w-full text-left text-sm text-muse-subtext">
            <thead className="bg-muse-dark/80 text-xs font-bold uppercase tracking-wider text-white border-b border-muse-border/40">
              <tr>
                <th className="p-4">Playlist</th>
                <th className="p-4">Creator</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muse-border/20">
              {playlists.map((pl: any) => (
                <tr key={pl.id} className="hover:bg-muse-hover/30 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img
                      src={pl.cover_art || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=80&q=80'}
                      alt={pl.name}
                      className="w-9 h-9 rounded-lg object-cover border border-muse-border/40"
                    />
                    <div>
                      <span className="font-semibold text-white block">{pl.name}</span>
                      <span className="text-[11px] text-muse-subtext">{pl.songs_count || pl.songs?.length || 0} songs</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-medium">{pl.user_name || 'User'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                      pl.is_public !== false
                        ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                    }`}>
                      {pl.is_public !== false ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{pl.is_public !== false ? 'Public' : 'Private'}</span>
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeletePlaylist(pl.id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                      title="Delete Inappropriate Playlist"
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

      {/* Upload Song Modal */}
      {isUploadModalOpen && (
        <UploadSongModal
          onClose={() => setIsUploadModalOpen(false)}
          onUploaded={fetchAdminData}
        />
      )}

      {/* Admin Edit Artist Image Modal */}
      {editingArtist && (
        <EditArtistImageModal
          artist={editingArtist}
          onClose={() => setEditingArtist(null)}
          onUpdated={fetchAdminData}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
