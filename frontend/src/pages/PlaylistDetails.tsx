import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Edit3, Trash2, Trash, Music, Globe, Lock, ShieldAlert, Upload, Loader2, Search, Plus, Check, Sparkles } from 'lucide-react';
import api from '../services/api';
import { Playlist, Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import SongRow from '../components/SongRow';

const PlaylistDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Catalogue songs & search to add to playlist
  const [catalogueSongs, setCatalogueSongs] = useState<Song[]>([]);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [addingSongId, setAddingSongId] = useState<string | null>(null);
  const [removingSongId, setRemovingSongId] = useState<string | null>(null);
  const [addedSongMap, setAddedSongMap] = useState<{ [key: string]: boolean }>({});
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { playSong } = usePlayer();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchCatalogueSongs = async () => {
    try {
      setLoadingCatalogue(true);
      const res = await api.get('/songs?limit=50');
      setCatalogueSongs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch catalogue songs:', err);
    } finally {
      setLoadingCatalogue(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    if (!file || !playlist) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/image', formData);
      const newCoverUrl = res.data.url;
      await api.put(`/playlists/${id}`, {
        name: playlist.name,
        description: playlist.description,
        is_public: playlist.is_public,
        cover_art: newCoverUrl
      });
      setPlaylist(prev => prev ? { ...prev, cover_art: newCoverUrl } : null);
    } catch (err) {
      console.error('Failed to upload cover:', err);
    } finally {
      setUploadingCover(false);
    }
  };

  const fetchPlaylist = async () => {
    try {
      setForbidden(false);
      const res = await api.get(`/playlists/${id}`);
      setPlaylist(res.data);
      setEditName(res.data.name);
      setEditDesc(res.data.description || '');
      setEditIsPublic(res.data.is_public !== false);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setForbidden(true);
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
    fetchCatalogueSongs();
  }, [id]);

  const handleAddSong = async (songId: string) => {
    if (addingSongId === songId) return;
    setAddingSongId(songId);
    try {
      await api.post(`/playlists/${id}/songs`, { song_id: songId });
      setAddedSongMap(prev => ({ ...prev, [songId]: true }));
      await fetchPlaylist();
    } catch (err) {
      console.error('Failed to add song to playlist:', err);
    } finally {
      setAddingSongId(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/playlists/${id}`, {
        name: editName,
        description: editDesc,
        is_public: editIsPublic
      });
      setIsEditing(false);
      fetchPlaylist();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!playlist) return;
    const newStatus = !(playlist.is_public !== false);
    try {
      await api.put(`/playlists/${id}`, {
        name: playlist.name,
        description: playlist.description,
        is_public: newStatus
      });
      setPlaylist(prev => prev ? { ...prev, is_public: newStatus } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await api.delete(`/playlists/${id}`);
      navigate('/library');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSong = async (songId: string) => {
    setRemovingSongId(songId);
    try {
      await api.delete(`/playlists/${id}/songs/${songId}`);
      setAddedSongMap(prev => ({ ...prev, [songId]: false }));
      await fetchPlaylist();
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingSongId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-muse-subtext font-medium">Loading playlist...</span>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Private Playlist</h2>
        <p className="text-xs text-muse-subtext leading-relaxed">
          This playlist is set to private by its creator. You do not have permission to view its contents.
        </p>
        <button
          onClick={() => navigate('/library')}
          className="px-6 py-2 rounded-full bg-muse-card border border-muse-border/50 text-xs font-bold text-white hover:bg-muse-hover transition-colors"
        >
          Return to Library
        </button>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-12 text-center text-muse-subtext space-y-3">
        <p className="text-lg font-bold text-white">Playlist not found</p>
        <button
          onClick={() => navigate('/library')}
          className="px-5 py-2 rounded-full bg-muse-card border border-muse-border/40 text-xs text-white"
        >
          Return to Library
        </button>
      </div>
    );
  }

  const isOwner = user?.id === playlist.user_id || user?.role === 'admin';

  const playlistSongIds = new Set(playlist.songs?.map((s) => s.id) || []);
  const isSongInPlaylist = (songId: string) => {
    if (addedSongMap[songId] === false) return false;
    if (addedSongMap[songId] === true) return true;
    return playlistSongIds.has(songId);
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const filteredCatalogue = catalogueSongs.filter((song) => {
    if (!songSearchQuery.trim()) return true;
    const q = songSearchQuery.toLowerCase();
    return (
      song.title?.toLowerCase().includes(q) ||
      song.artist_name?.toLowerCase().includes(q) ||
      song.album_title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 md:p-10 space-y-8 pb-24 select-none max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-purple-900/40 via-muse-card/60 to-muse-dark p-6 md:p-8 rounded-3xl border border-muse-border/40 backdrop-blur-xl">
        <div className="relative group/cover shrink-0">
          <img
            src={playlist.cover_art || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80'}
            alt={playlist.name}
            className="w-44 h-44 md:w-52 md:h-52 rounded-2xl object-cover shadow-2xl border border-muse-border/40"
          />
          {isOwner && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCoverUpload(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-2xl opacity-0 group-hover/cover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white cursor-pointer"
                title="Upload new playlist cover"
              >
                {uploadingCover ? (
                  <Loader2 className="w-7 h-7 text-pink-500 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-pink-400" />
                    <span className="text-xs font-bold">Upload Cover</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        <div className="space-y-3 flex-1 text-center sm:text-left min-w-0 w-full">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-400">PLAYLIST</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-md border ${
              playlist.is_public !== false
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            }`}>
              {playlist.is_public !== false ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              <span>{playlist.is_public !== false ? 'Public' : 'Private'}</span>
            </span>
          </div>
          
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-3 max-w-lg">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-muse-dark/80 border border-muse-border/50 rounded-xl px-3 py-1.5 text-xl font-bold text-white focus:outline-none focus:border-pink-500"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full bg-muse-dark/80 border border-muse-border/50 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                rows={2}
                placeholder="Playlist description"
              />
              <div className="flex items-center gap-3">
                <label className="text-xs text-muse-subtext flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsPublic}
                    onChange={(e) => setEditIsPublic(e.target.checked)}
                    className="rounded text-pink-500 focus:ring-pink-500"
                  />
                  <span>Make playlist public</span>
                </label>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md shadow-pink-500/20 cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-1.5 rounded-full bg-muse-card border border-muse-border/40 text-white text-xs hover:bg-muse-hover cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-3xl md:text-5xl font-black text-white truncate tracking-tight">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-xs md:text-sm text-muse-subtext max-w-xl">{playlist.description}</p>
              )}
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-muse-subtext pt-1">
                <span className="text-white font-bold">{playlist.user_name || 'User'}</span>
                <span>•</span>
                <span>{playlist.songs?.length || 0} {playlist.songs?.length === 1 ? 'song' : 'songs'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => playlist.songs && playlist.songs.length > 0 && playSong(playlist.songs[0], playlist.songs, { type: 'Playlist', name: playlist.name })}
            disabled={!playlist.songs || playlist.songs.length === 0}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-pink-500/30 disabled:opacity-40 cursor-pointer"
            title="Play All"
          >
            <Play className="w-7 h-7 fill-white ml-0.5" />
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-3 rounded-full bg-muse-card/80 border border-muse-border/40 text-muse-subtext hover:text-white hover:bg-muse-hover transition-colors cursor-pointer"
                title="Edit Playlist Details"
              >
                <Edit3 className="w-5 h-5" />
              </button>

              <button
                onClick={handleTogglePrivacy}
                className="px-3.5 py-2 rounded-full bg-muse-card/80 border border-muse-border/40 text-muse-subtext hover:text-white hover:bg-muse-hover text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Toggle Public / Private"
              >
                {playlist.is_public !== false ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Globe className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Set to {playlist.is_public !== false ? 'Private' : 'Public'}</span>
              </button>

              <button
                onClick={handleDelete}
                className="p-3 rounded-full bg-muse-card/80 border border-muse-border/40 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
                title="Delete Playlist"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Song List */}
      <div className="glass-panel rounded-2xl border border-muse-border/40 p-4 divide-y divide-muse-border/20">
        {playlist.songs && playlist.songs.length > 0 ? (
          playlist.songs.map((song, i) => (
            <SongRow
              key={song.id}
              song={song}
              index={i}
              queue={playlist.songs}
              showRemove={isOwner}
              onRemove={() => handleRemoveSong(song.id)}
            />
          ))
        ) : (
          <div className="py-12 text-center text-muse-subtext space-y-3">
            <div className="w-12 h-12 rounded-full bg-muse-card flex items-center justify-center mx-auto border border-muse-border/40 text-muse-subtext">
              <Music className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <p className="text-base font-bold text-white">This playlist is empty</p>
              <p className="text-xs text-muse-subtext mt-1">
                {isOwner
                  ? "Browse existing PlayX songs below and click '+ Add' on any song to add it!"
                  : "The creator hasn't added any songs yet."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Spotify-style "Add songs from PlayX catalogue" section */}
      {isOwner && (
        <div className="space-y-5 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/40 via-muse-card/60 to-muse-card/40 p-5 rounded-2xl border border-muse-border/40 backdrop-blur-md">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                Add PlayX Songs to this Playlist
              </h3>
              <p className="text-xs text-muse-subtext mt-0.5">
                Find existing tracks from the PlayX catalogue and add them directly to "{playlist.name}"
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muse-subtext" />
              <input
                type="text"
                value={songSearchQuery}
                onChange={(e) => setSongSearchQuery(e.target.value)}
                placeholder="Search title, artist, or album..."
                className="w-full bg-muse-dark/80 border border-muse-border/40 rounded-full pl-9 pr-8 py-2 text-xs text-white placeholder:text-muse-subtext/60 focus:outline-none focus:border-pink-500/80 transition-colors"
              />
              {songSearchQuery && (
                <button
                  onClick={() => setSongSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muse-subtext hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Available Songs List */}
          <div className="glass-panel rounded-2xl border border-muse-border/40 divide-y divide-muse-border/20 overflow-hidden">
            {loadingCatalogue ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muse-subtext">
                <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
                <span className="text-xs">Loading PlayX songs...</span>
              </div>
            ) : filteredCatalogue.length > 0 ? (
              filteredCatalogue.slice(0, 15).map((song) => {
                const inPlaylist = isSongInPlaylist(song.id);
                const isAdding = addingSongId === song.id;

                return (
                  <div
                    key={song.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muse-hover/40 transition-colors group"
                  >
                    {/* Song info & play preview */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-muse-border/40 group/thumb shadow-sm">
                        <img
                          src={song.cover_art || song.album_cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=100&q=80'}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => playSong(song, [song])}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity text-white cursor-pointer"
                          title="Preview song"
                        >
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </button>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate group-hover:text-pink-400 transition-colors">
                          {song.title}
                        </p>
                        <p className="text-xs text-muse-subtext truncate">
                          {song.artist_name || 'Artist'} {song.album_title ? `• ${song.album_title}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Duration */}
                    <span className="hidden sm:block text-xs text-muse-subtext font-medium pr-2">
                      {formatDuration(song.duration)}
                    </span>

                    {/* Add / Remove Option on the Side of the Song */}
                    <div className="shrink-0 flex items-center gap-2">
                      {inPlaylist ? (
                        <>
                          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 select-none">
                            <Check className="w-3.5 h-3.5" />
                            Added
                          </span>
                          <button
                            onClick={() => handleRemoveSong(song.id)}
                            disabled={removingSongId === song.id}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
                            title="Remove from this playlist"
                          >
                            {removingSongId === song.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Remove
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleAddSong(song.id)}
                          disabled={addingSongId === song.id}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 active:scale-95 shadow-md shadow-pink-500/25 transition-all cursor-pointer disabled:opacity-50"
                          title="Add to this playlist"
                        >
                          {addingSongId === song.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-muse-subtext space-y-2">
                <Music className="w-8 h-8 mx-auto text-muse-subtext/30" />
                <p className="text-sm font-semibold text-white">No songs found matching "{songSearchQuery}"</p>
                <p className="text-xs text-muse-subtext">Try searching with a different keyword.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistDetails;
