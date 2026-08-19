import React, { useEffect, useState } from 'react';
import { Mic2, Plus, Edit2, Trash2, Disc, Music, Play, Eye } from 'lucide-react';
import api from '../services/api';
import { Song, Album } from '../types';
import { useAuth } from '../context/AuthContext';

const ArtistDashboard: React.FC = () => {
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  // Song Modal state
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [coverArt, setCoverArt] = useState('');
  const [albumId, setAlbumId] = useState('');

  // Album Modal state
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumCover, setAlbumCover] = useState('');

  const fetchArtistData = async () => {
    try {
      const [songRes, albRes] = await Promise.all([
        api.get('/songs'),
        api.get('/albums')
      ]);
      setSongs(songRes.data);
      setAlbums(albRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtistData();
  }, []);

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSongId) {
        await api.put(`/artists/dashboard/songs/${editingSongId}`, {
          title: songTitle,
          audio_url: audioUrl,
          cover_art: coverArt,
          album_id: albumId || null
        });
      } else {
        await api.post('/artists/dashboard/songs', {
          title: songTitle,
          audio_url: audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          cover_art: coverArt || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
          album_id: albumId || null
        });
      }
      setIsSongModalOpen(false);
      resetSongForm();
      fetchArtistData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSong = async (id: string) => {
    if (!window.confirm('Delete this song?')) return;
    try {
      await api.delete(`/artists/dashboard/songs/${id}`);
      fetchArtistData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/artists/dashboard/albums', {
        title: albumTitle,
        cover_art: albumCover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'
      });
      setIsAlbumModalOpen(false);
      setAlbumTitle('');
      setAlbumCover('');
      fetchArtistData();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (song: Song) => {
    setEditingSongId(song.id);
    setSongTitle(song.title);
    setAudioUrl(song.audio_url);
    setCoverArt(song.cover_art || '');
    setAlbumId(song.album_id || '');
    setIsSongModalOpen(true);
  };

  const resetSongForm = () => {
    setEditingSongId(null);
    setSongTitle('');
    setAudioUrl('');
    setCoverArt('');
    setAlbumId('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalPlays = songs.reduce((acc, curr) => acc + (curr.plays_count || 0), 0);

  return (
    <div className="p-8 space-y-10 pb-20 select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-purple-900/40 via-spotify-card to-black p-6 rounded-3xl border border-purple-500/20 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Mic2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">Artist Creator Studio</h1>
            <p className="text-xs text-spotify-subtext">Publish songs, manage albums, and monitor stream analytics.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { resetSongForm(); setIsSongModalOpen(true); }}
            className="px-5 py-2.5 rounded-full bg-spotify-green text-black font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Song</span>
          </button>
          <button
            onClick={() => setIsAlbumModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-spotify-card border border-spotify-hover text-white font-bold text-xs flex items-center gap-2 hover:bg-spotify-hover transition-colors"
          >
            <Disc className="w-4 h-4 text-purple-400" />
            <span>Create Album</span>
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-spotify-hover/40 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-spotify-green/20 text-spotify-green">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-white">{songs.length}</span>
            <p className="text-xs text-spotify-subtext font-medium">Total Published Songs</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-spotify-hover/40 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Play className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-white">{totalPlays.toLocaleString()}</span>
            <p className="text-xs text-spotify-subtext font-medium">Total Streams</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-spotify-hover/40 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
            <Disc className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-white">{albums.length}</span>
            <p className="text-xs text-spotify-subtext font-medium">Albums Catalog</p>
          </div>
        </div>
      </div>

      {/* Published Songs Table */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Your Song Catalog</h2>
        <div className="bg-spotify-card/40 rounded-2xl border border-spotify-hover/40 p-4 divide-y divide-spotify-hover/30">
          {songs.map((song) => (
            <div key={song.id} className="flex items-center justify-between p-3 hover:bg-spotify-hover/50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <img src={song.cover_art || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=100&q=80'} className="w-10 h-10 rounded object-cover" />
                <div>
                  <h4 className="font-bold text-sm text-white">{song.title}</h4>
                  <p className="text-xs text-spotify-subtext">{(song.plays_count || 0).toLocaleString()} plays</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => openEditModal(song)} className="p-2 rounded bg-spotify-hover text-spotify-subtext hover:text-white transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteSong(song.id)} className="p-2 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Song Add/Edit Modal */}
      {isSongModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-spotify-card border border-spotify-hover rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">{editingSongId ? 'Edit Song' : 'Add New Song'}</h3>
            <form onSubmit={handleSaveSong} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-spotify-subtext mb-1">Song Title</label>
                <input type="text" required value={songTitle} onChange={(e) => setSongTitle(e.target.value)} className="w-full bg-black/60 border border-spotify-hover rounded px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-spotify-subtext mb-1">Audio URL (MP3)</label>
                <input type="text" placeholder="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} className="w-full bg-black/60 border border-spotify-hover rounded px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-spotify-subtext mb-1">Cover Art URL</label>
                <input type="text" value={coverArt} onChange={(e) => setCoverArt(e.target.value)} className="w-full bg-black/60 border border-spotify-hover rounded px-3 py-2 text-sm text-white" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsSongModalOpen(false)} className="px-4 py-2 text-xs font-bold text-spotify-subtext">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-spotify-green text-black font-bold text-xs rounded-full">Save Song</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Album Modal */}
      {isAlbumModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-spotify-card border border-spotify-hover rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create New Album</h3>
            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-spotify-subtext mb-1">Album Title</label>
                <input type="text" required value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} className="w-full bg-black/60 border border-spotify-hover rounded px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-spotify-subtext mb-1">Cover Art URL</label>
                <input type="text" value={albumCover} onChange={(e) => setAlbumCover(e.target.value)} className="w-full bg-black/60 border border-spotify-hover rounded px-3 py-2 text-sm text-white" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAlbumModalOpen(false)} className="px-4 py-2 text-xs font-bold text-spotify-subtext">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-spotify-green text-black font-bold text-xs rounded-full">Create Album</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistDashboard;
