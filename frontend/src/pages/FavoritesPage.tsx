import React, { useEffect, useState } from 'react';
import { Play, Heart, Music } from 'lucide-react';
import api from '../services/api';
import { Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import SongRow from '../components/SongRow';

const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const { playSong } = usePlayer();
  const { user } = useAuth();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await api.get('/favorites');
        setFavorites(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 pb-20 select-none">
      {/* Header */}
      <div className="flex items-end gap-6 bg-gradient-to-b from-indigo-900/60 via-purple-900/40 to-spotify-card p-8 rounded-3xl border border-indigo-500/20 shadow-2xl">
        <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shrink-0">
          <Heart className="w-24 h-24 text-white fill-white animate-pulse" />
        </div>
        <div className="space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">PLAYLIST</span>
          <h1 className="text-5xl font-black text-white">Liked Songs</h1>
          <div className="flex items-center gap-2 text-xs font-semibold text-spotify-subtext">
            <span className="text-white font-bold">{user?.name || 'User'}</span>
            <span>•</span>
            <span>{favorites.length} songs</span>
          </div>
        </div>
      </div>

      {/* Play All Button */}
      {favorites.length > 0 && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => playSong(favorites[0], favorites)}
            className="w-14 h-14 rounded-full bg-spotify-green flex items-center justify-center text-black hover:scale-105 transition-transform shadow-xl shadow-spotify-green/20"
          >
            <Play className="w-7 h-7 fill-black ml-1" />
          </button>
        </div>
      )}

      {/* List */}
      <div className="bg-spotify-card/40 rounded-2xl border border-spotify-hover/40 p-4 divide-y divide-spotify-hover/30">
        {favorites.length > 0 ? (
          favorites.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} queue={favorites} />
          ))
        ) : (
          <div className="py-16 text-center text-spotify-subtext">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-bold text-white mb-1">Songs you like will appear here</h3>
            <p className="text-xs">Save songs by tapping the heart icon anywhere across PLAYX.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
