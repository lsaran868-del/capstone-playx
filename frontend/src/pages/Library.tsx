import React, { useEffect, useState } from 'react';
import { Music, User, Disc, ListMusic } from 'lucide-react';
import api from '../services/api';
import { Song, Artist, Album, Playlist } from '../types';
import Card from '../components/Card';
import SongRow from '../components/SongRow';
import { useNavigate } from 'react-router-dom';

const Library: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playlists' | 'songs' | 'artists' | 'albums'>('playlists');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const [plRes, songRes, artRes, albRes] = await Promise.all([
          api.get('/playlists'),
          api.get('/songs'),
          api.get('/artists'),
          api.get('/albums')
        ]);
        setPlaylists(plRes.data);
        setSongs(songRes.data);
        setArtists(artRes.data);
        setAlbums(albRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLibrary();
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
      <h1 className="text-3xl font-extrabold text-white">Your Music Library</h1>

      {/* Library Tabs */}
      <div className="flex items-center gap-3 border-b border-spotify-hover/40 pb-4">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-colors ${
            activeTab === 'playlists' ? 'bg-white text-black' : 'bg-spotify-card text-spotify-subtext hover:text-white'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>Playlists</span>
        </button>
        <button
          onClick={() => setActiveTab('songs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-colors ${
            activeTab === 'songs' ? 'bg-white text-black' : 'bg-spotify-card text-spotify-subtext hover:text-white'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Songs</span>
        </button>
        <button
          onClick={() => setActiveTab('artists')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-colors ${
            activeTab === 'artists' ? 'bg-white text-black' : 'bg-spotify-card text-spotify-subtext hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Artists</span>
        </button>
        <button
          onClick={() => setActiveTab('albums')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-colors ${
            activeTab === 'albums' ? 'bg-white text-black' : 'bg-spotify-card text-spotify-subtext hover:text-white'
          }`}
        >
          <Disc className="w-4 h-4" />
          <span>Albums</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'playlists' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {playlists.map((pl) => (
            <Card
              key={pl.id}
              id={pl.id}
              title={pl.name}
              subtitle={pl.description || `By ${pl.user_name || 'User'}`}
              image={pl.cover_art}
              type="playlist"
              onClick={() => navigate(`/playlist/${pl.id}`)}
            />
          ))}
        </div>
      )}

      {activeTab === 'songs' && (
        <div className="bg-spotify-card/40 rounded-2xl border border-spotify-hover/40 p-4 divide-y divide-spotify-hover/30">
          {songs.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} queue={songs} />
          ))}
        </div>
      )}

      {activeTab === 'artists' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {artists.map((artist) => (
            <Card
              key={artist.id}
              id={artist.id}
              title={artist.name}
              subtitle="Artist"
              image={artist.image}
              type="artist"
              onClick={() => navigate(`/artist/${artist.id}`)}
            />
          ))}
        </div>
      )}

      {activeTab === 'albums' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
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
    </div>
  );
};

export default Library;
