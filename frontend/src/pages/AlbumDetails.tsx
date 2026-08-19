import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Disc } from 'lucide-react';
import api from '../services/api';
import { Album } from '../types';
import { usePlayer } from '../context/PlayerContext';
import SongRow from '../components/SongRow';

const AlbumDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  const { playSong } = usePlayer();

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const res = await api.get(`/albums/${id}`);
        setAlbum(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!album) return <div className="p-8 text-spotify-subtext">Album not found.</div>;

  return (
    <div className="p-8 space-y-8 pb-20 select-none">
      {/* Header */}
      <div className="flex items-end gap-6 bg-gradient-to-b from-purple-900/40 via-spotify-card/80 to-spotify-card p-6 rounded-3xl border border-spotify-hover/40">
        <img
          src={album.cover_art || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'}
          alt={album.title}
          className="w-48 h-48 rounded-2xl object-cover shadow-2xl border border-spotify-hover/60"
        />
        <div className="space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400">ALBUM</span>
          <h1 className="text-4xl font-black text-white">{album.title}</h1>
          <div className="flex items-center gap-2 text-xs font-semibold text-spotify-subtext">
            <span className="text-white font-bold">{album.artist_name || 'Artist'}</span>
            <span>•</span>
            <span>{album.release_year || 2024}</span>
            <span>•</span>
            <span>{album.songs?.length || 0} tracks</span>
          </div>
        </div>
      </div>

      {/* Play Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => album.songs && album.songs.length > 0 && playSong(album.songs[0], album.songs)}
          className="w-14 h-14 rounded-full bg-spotify-green flex items-center justify-center text-black hover:scale-105 transition-transform shadow-xl shadow-spotify-green/20"
        >
          <Play className="w-7 h-7 fill-black ml-1" />
        </button>
      </div>

      {/* Song list */}
      <div className="bg-spotify-card/40 rounded-2xl border border-spotify-hover/40 p-4 divide-y divide-spotify-hover/30">
        {album.songs && album.songs.length > 0 ? (
          album.songs.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} queue={album.songs} />
          ))
        ) : (
          <div className="py-12 text-center text-spotify-subtext">
            <Disc className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No tracks available for this album.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumDetails;
