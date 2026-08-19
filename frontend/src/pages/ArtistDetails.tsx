import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, CheckCircle2, Mic2 } from 'lucide-react';
import api from '../services/api';
import { Artist } from '../types';
import { usePlayer } from '../context/PlayerContext';
import SongRow from '../components/SongRow';
import Card from '../components/Card';

const ArtistDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  const { playSong } = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const res = await api.get(`/artists/${id}`);
        setArtist(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtist();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!artist) return <div className="p-8 text-spotify-subtext">Artist not found.</div>;

  return (
    <div className="p-8 space-y-10 pb-20 select-none">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/60 via-spotify-card to-black p-8 border border-spotify-hover/40 shadow-2xl flex items-center gap-8">
        <img
          src={artist.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'}
          alt={artist.name}
          className="w-40 h-40 rounded-full object-cover shadow-2xl border-4 border-spotify-green/40"
        />
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            {artist.is_verified && (
              <span className="flex items-center gap-1 text-xs font-bold text-sky-400 bg-sky-400/10 px-3 py-1 rounded-full border border-sky-400/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Artist</span>
              </span>
            )}
          </div>
          <h1 className="text-4xl font-black text-white">{artist.name}</h1>
          {artist.bio && <p className="text-sm text-spotify-subtext max-w-xl leading-relaxed">{artist.bio}</p>}
          <p className="text-xs font-bold text-spotify-green">
            {(artist.monthly_listeners || 0).toLocaleString()} Monthly Listeners
          </p>
        </div>
      </div>

      {/* Popular Songs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Popular Tracks</h2>
          {artist.songs && artist.songs.length > 0 && (
            <button
              onClick={() => playSong(artist.songs![0], artist.songs)}
              className="px-6 py-2.5 rounded-full bg-spotify-green text-black font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Play Top Tracks</span>
            </button>
          )}
        </div>
        <div className="bg-spotify-card/40 rounded-2xl border border-spotify-hover/40 p-4 divide-y divide-spotify-hover/30">
          {artist.songs && artist.songs.length > 0 ? (
            artist.songs.slice(0, 5).map((song, i) => (
              <SongRow key={song.id} song={song} index={i} queue={artist.songs} />
            ))
          ) : (
            <div className="py-8 text-center text-spotify-subtext text-sm">No songs added yet by this artist.</div>
          )}
        </div>
      </section>

      {/* Albums */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Albums</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {artist.albums && artist.albums.length > 0 ? (
            artist.albums.map((album) => (
              <Card
                key={album.id}
                id={album.id}
                title={album.title}
                subtitle={`${album.release_year || 2024} • Album`}
                image={album.cover_art}
                type="album"
                onClick={() => navigate(`/album/${album.id}`)}
              />
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-spotify-subtext text-sm">No albums release found.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ArtistDetails;
