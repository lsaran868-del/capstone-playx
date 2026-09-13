import React, { useEffect, useState } from 'react';
import { Music, User, Disc, ListMusic, Heart, Clock, Plus, Play, Globe, Lock } from 'lucide-react';
import api from '../services/api';
import { Song, Artist, Album, Playlist } from '../types';
import Card from '../components/Card';
import SongRow from '../components/SongRow';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import CreatePlaylistModal from '../components/Modals/CreatePlaylistModal';

const Library: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'songs' | 'playlists' | 'liked' | 'history' | 'artists' | 'albums'>('songs');
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [history, setHistory] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { playSong } = usePlayer();
  const navigate = useNavigate();

  const fetchLibrary = async () => {
    try {
      const [plRes, favRes, histRes, artRes, albRes, sngRes] = await Promise.allSettled([
        api.get('/playlists'),
        api.get('/favorites'),
        api.get('/history'),
        api.get('/artists'),
        api.get('/albums'),
        api.get('/songs')
      ]);
      if (plRes.status === 'fulfilled') setPlaylists(plRes.value.data || []);
      if (favRes.status === 'fulfilled') setFavorites(favRes.value.data || []);
      if (histRes.status === 'fulfilled') setHistory(histRes.value.data || []);
      if (artRes.status === 'fulfilled') setArtists(artRes.value.data || []);
      if (albRes.status === 'fulfilled') setAlbums(albRes.value.data || []);
      if (sngRes.status === 'fulfilled') setSongs(sngRes.value.data || []);
    } catch (err) {
      console.error('Error loading library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-muse-subtext font-medium">Loading your music library...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 pb-24 select-none max-w-7xl mx-auto">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Music Library</h1>
          <p className="text-xs text-muse-subtext mt-1">Manage your liked tracks, playlists, and listening history</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Featured Quick Cards (Spotify-style Liked Songs Card + Recent Summary) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Liked Songs Hero Card */}
        <div
          onClick={() => navigate('/favorites')}
          className="relative h-44 rounded-3xl p-6 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 cursor-pointer shadow-xl group overflow-hidden border border-white/10 hover:shadow-pink-500/20 transition-all flex flex-col justify-between"
        >
          <div className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-white text-pink-600 flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110">
            <Play className="w-5 h-5 fill-pink-600 ml-0.5" />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-white/80">Auto Playlist</span>
          </div>

          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Liked Songs</h2>
            <p className="text-xs text-white/80 font-semibold mt-1">
              {favorites.length} {favorites.length === 1 ? 'song' : 'songs'} saved
            </p>
          </div>
        </div>

        {/* Recently Played Summary Card */}
        <div
          onClick={() => navigate('/history')}
          className="relative h-44 rounded-3xl p-6 glass-panel border border-muse-border/40 hover:border-pink-500/50 cursor-pointer shadow-xl group overflow-hidden transition-all flex flex-col justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-muse-subtext">Activity</span>
          </div>

          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Recently Played</h2>
            <p className="text-xs text-muse-subtext font-semibold mt-1">
              {history.length} {history.length === 1 ? 'track' : 'tracks'} listened
            </p>
          </div>
        </div>

        {/* Playlists Summary Card */}
        <div
          onClick={() => setActiveTab('playlists')}
          className="relative h-44 rounded-3xl p-6 glass-panel border border-muse-border/40 hover:border-pink-500/50 cursor-pointer shadow-xl group overflow-hidden transition-all flex flex-col justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ListMusic className="w-5 h-5" />
            </div>
            <span className="text-xs uppercase font-bold tracking-wider text-muse-subtext">Collections</span>
          </div>

          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Your Playlists</h2>
            <p className="text-xs text-muse-subtext font-semibold mt-1">
              {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'} available
            </p>
          </div>
        </div>
      </div>

      {/* Library Tabs */}
      <div className="flex items-center gap-2 border-b border-muse-border/30 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('songs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'songs'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
              : 'bg-muse-card/60 border border-muse-border/40 text-muse-subtext hover:text-white'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>All Songs ({songs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'playlists'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
              : 'bg-muse-card/60 border border-muse-border/40 text-muse-subtext hover:text-white'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>Playlists ({playlists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('liked')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'liked'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
              : 'bg-muse-card/60 border border-muse-border/40 text-muse-subtext hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Liked Songs ({favorites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
              : 'bg-muse-card/60 border border-muse-border/40 text-muse-subtext hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Recently Played ({history.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('artists')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'artists'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
              : 'bg-muse-card/60 border border-muse-border/40 text-muse-subtext hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Artists ({artists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('albums')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'albums'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
              : 'bg-muse-card/60 border border-muse-border/40 text-muse-subtext hover:text-white'
          }`}
        >
          <Disc className="w-4 h-4" />
          <span>Albums ({albums.length})</span>
        </button>
      </div>

      {/* Tab Contents: All Songs */}
      {activeTab === 'songs' && (
        <div className="space-y-4">
          {songs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Music className="w-10 h-10 text-pink-500/40 mx-auto" />
              <p className="text-base text-white font-bold">No songs in library</p>
              <p className="text-xs text-muse-subtext">Uploaded tracks and songs will appear here.</p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-muse-border/40 p-4 divide-y divide-muse-border/20">
              {songs.map((song, i) => (
                <SongRow key={`lib-${song.id}`} song={song} index={i} queue={songs} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: Playlists */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          {playlists.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-base text-white font-bold">No playlists found</p>
              <p className="text-xs text-muse-subtext">Click "New Playlist" above to create your first collection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {playlists.map((pl) => (
                <Card
                  key={pl.id}
                  id={pl.id}
                  title={pl.name}
                  subtitle={pl.description || `By ${pl.user_name || 'User'}`}
                  image={pl.cover_art || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80'}
                  type="playlist"
                  badge={
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-md border ${
                      pl.is_public !== false
                        ? 'bg-emerald-500/40 border-emerald-400/50 text-emerald-100'
                        : 'bg-amber-500/40 border-amber-400/50 text-amber-100'
                    }`}>
                      {pl.is_public !== false ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                      {pl.is_public !== false ? 'Public' : 'Private'}
                    </span>
                  }
                  onClick={() => navigate(`/playlist/${pl.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: Liked Songs */}
      {activeTab === 'liked' && (
        <div className="space-y-4">
          {favorites.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Heart className="w-10 h-10 text-pink-500/40 mx-auto" />
              <p className="text-base text-white font-bold">No liked songs yet</p>
              <p className="text-xs text-muse-subtext">Heart songs across PlayX to build your favorite music collection.</p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-muse-border/40 p-4 divide-y divide-muse-border/20">
              {favorites.map((song, i) => (
                <SongRow key={`fav-${song.id}`} song={song} index={i} queue={favorites} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: Recently Played History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Clock className="w-10 h-10 text-pink-500/40 mx-auto" />
              <p className="text-base text-white font-bold">No listening history</p>
              <p className="text-xs text-muse-subtext">Tracks you play will appear here in chronological order.</p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-muse-border/40 p-4 divide-y divide-muse-border/20">
              {history.map((song, i) => (
                <SongRow key={`hist-${song.id}`} song={song} index={i} queue={history} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: Artists */}
      {activeTab === 'artists' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {artists.map((artist) => (
            <Card
              key={artist.id}
              id={artist.id}
              title={artist.name}
              subtitle={`${(artist.monthly_listeners || 0).toLocaleString()} listeners`}
              image={artist.image}
              type="artist"
              onClick={() => navigate(`/artist/${artist.id}`)}
            />
          ))}
        </div>
      )}

      {/* Tab Contents: Albums */}
      {activeTab === 'albums' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {albums.map((album) => (
            <Card
              key={album.id}
              id={album.id}
              title={album.title}
              subtitle={album.artist_name || 'Album'}
              image={album.cover_art}
              type="album"
              onClick={() => navigate(`/album/${album.id}`)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePlaylistModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchLibrary}
        />
      )}
    </div>
  );
};

export default Library;
