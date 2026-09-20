import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, CheckCircle2, Music, Disc, Camera } from 'lucide-react';
import api from '../services/api';
import { Artist } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import SongRow from '../components/SongRow';
import Card from '../components/Card';
import EditArtistImageModal from '../components/Modals/EditArtistImageModal';

const ArtistDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { playSong } = usePlayer();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchArtist = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.get(`/artists/${encodeURIComponent(id)}`);
        setArtist(res.data);
      } catch (err) {
        console.error('Failed to load artist details:', err);
        setArtist(null);
      } finally {
        setLoading(false);
      }
    };
    fetchArtist();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-muse-subtext font-medium">Loading artist profile...</span>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="p-12 text-center text-muse-subtext space-y-3">
        <p className="text-lg font-bold text-white">Artist not found</p>
        <button
          onClick={() => navigate('/library')}
          className="px-5 py-2 rounded-full bg-muse-card border border-muse-border/40 text-xs text-white"
        >
          Return to Library
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-10 pb-24 select-none max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-purple-900/30 to-muse-dark p-6 md:p-8 border border-muse-border/40 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center sm:items-end gap-6 md:gap-8 text-center sm:text-left">
        {/* Circular Avatar with Admin Image Edit Trigger */}
        <div className="relative group shrink-0">
          <img
            src={artist.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'}
            alt={artist.name}
            className="w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover shadow-2xl border-4 border-pink-500/50"
          />

          {isAdmin && (
            <>
              {/* Overlay on hover for Admin */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                aria-label="Change artist profile photo"
                className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 text-white cursor-pointer backdrop-blur-[2px] border-4 border-pink-400"
              >
                <Camera className="w-7 h-7 text-pink-300 drop-shadow-md" />
                <span className="text-[11px] font-bold tracking-wide uppercase text-white bg-black/40 px-2.5 py-0.5 rounded-full border border-pink-500/30">
                  Change Photo
                </span>
              </button>

              {/* Persistent Badge on bottom-right of avatar so admin easily sees edit option */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                title="Admin: Change Artist Image"
                className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 p-2.5 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30 hover:scale-110 active:scale-95 transition-all border-2 border-[#140b22] cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            {artist.is_verified && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-sky-300 bg-sky-500/20 px-3 py-1 rounded-full border border-sky-400/30 backdrop-blur-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Verified Artist</span>
              </span>
            )}
            {isAdmin && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 text-xs font-semibold transition-all hover:scale-105"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Change Photo</span>
              </button>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">{artist.name}</h1>
          {artist.bio && (
            <p className="text-xs md:text-sm text-muse-subtext max-w-xl leading-relaxed">
              {artist.bio}
            </p>
          )}
          <p className="text-xs font-bold text-pink-400">
            {(artist.monthly_listeners || 0).toLocaleString()} Monthly Listeners
          </p>
        </div>
      </div>

      {/* Popular Songs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-pink-400" />
            <span>Popular Tracks</span>
          </h2>
          {artist.songs && artist.songs.length > 0 && (
            <button
              onClick={() => playSong(artist.songs![0], artist.songs)}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-white ml-0.5" />
              <span>Play Top Tracks</span>
            </button>
          )}
        </div>
        <div className="glass-panel rounded-2xl border border-muse-border/40 p-4 divide-y divide-muse-border/20">
          {artist.songs && artist.songs.length > 0 ? (
            artist.songs.map((song, i) => (
              <SongRow key={song.id} song={song} index={i} queue={artist.songs} />
            ))
          ) : (
            <div className="py-8 text-center text-muse-subtext text-xs">No songs added yet by this artist.</div>
          )}
        </div>
      </section>

      {/* Albums */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Disc className="w-5 h-5 text-amber-400" />
          <span>Albums</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
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
            <div className="col-span-full py-8 text-center text-muse-subtext text-xs">No albums released yet.</div>
          )}
        </div>
      </section>

      {/* Admin Only: Edit Artist Image Modal */}
      {isAdmin && isEditModalOpen && (
        <EditArtistImageModal
          artist={artist}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={(newImageUrl) => {
            setArtist((prev) => (prev ? { ...prev, image: newImageUrl } : null));
          }}
        />
      )}
    </div>
  );
};

export default ArtistDetails;

