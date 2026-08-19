import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Edit3, Trash2, Trash, Music } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  const { playSong } = usePlayer();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchPlaylist = async () => {
    try {
      const res = await api.get(`/playlists/${id}`);
      setPlaylist(res.data);
      setEditName(res.data.name);
      setEditDesc(res.data.description || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/playlists/${id}`, { name: editName, description: editDesc });
      setIsEditing(false);
      fetchPlaylist();
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
    try {
      await api.delete(`/playlists/${id}/songs/${songId}`);
      fetchPlaylist();
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

  if (!playlist) {
    return (
      <div className="p-8 text-center text-spotify-subtext">
        <p>Playlist not found.</p>
      </div>
    );
  }

  const isOwner = user?.id === playlist.user_id || user?.role === 'admin';

  return (
    <div className="p-8 space-y-8 pb-20 select-none">
      {/* Header Banner */}
      <div className="flex items-end gap-6 bg-gradient-to-b from-indigo-900/40 via-spotify-card/80 to-spotify-card p-6 rounded-3xl border border-spotify-hover/40">
        <img
          src={playlist.cover_art || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80'}
          alt={playlist.name}
          className="w-48 h-48 rounded-2xl object-cover shadow-2xl border border-spotify-hover/60"
        />

        <div className="space-y-3 flex-1">
          <span className="text-xs font-extrabold uppercase tracking-widest text-spotify-green">PLAYLIST</span>
          
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-3 max-w-md">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-black/60 border border-spotify-hover rounded px-3 py-1.5 text-2xl font-bold text-white"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full bg-black/60 border border-spotify-hover rounded px-3 py-1 text-xs text-white"
                rows={2}
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-1 rounded bg-spotify-green text-black font-bold text-xs">Save</button>
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-1 rounded bg-spotify-card text-white text-xs">Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-4xl font-black text-white">{playlist.name}</h1>
              {playlist.description && <p className="text-sm text-spotify-subtext">{playlist.description}</p>}
              <div className="flex items-center gap-2 text-xs font-semibold text-spotify-subtext">
                <span className="text-white font-bold">{playlist.user_name || 'User'}</span>
                <span>•</span>
                <span>{playlist.songs?.length || 0} songs</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => playlist.songs && playlist.songs.length > 0 && playSong(playlist.songs[0], playlist.songs)}
            className="w-14 h-14 rounded-full bg-spotify-green flex items-center justify-center text-black hover:scale-105 transition-transform shadow-xl shadow-spotify-green/20"
            title="Play All"
          >
            <Play className="w-7 h-7 fill-black ml-1" />
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-3 rounded-full bg-spotify-card border border-spotify-hover text-spotify-subtext hover:text-white transition-colors"
                title="Rename Playlist"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-3 rounded-full bg-spotify-card border border-spotify-hover text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Delete Playlist"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Song List */}
      <div className="bg-spotify-card/40 rounded-2xl border border-spotify-hover/40 p-4 divide-y divide-spotify-hover/30">
        {playlist.songs && playlist.songs.length > 0 ? (
          playlist.songs.map((song, i) => (
            <div key={song.id} className="relative group">
              <SongRow song={song} index={i} queue={playlist.songs} />
              {isOwner && (
                <button
                  onClick={() => handleRemoveSong(song.id)}
                  className="absolute right-12 top-3 text-spotify-subtext hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from playlist"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-spotify-subtext">
            <Music className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">This playlist is empty. Add songs from search or library!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetails;
