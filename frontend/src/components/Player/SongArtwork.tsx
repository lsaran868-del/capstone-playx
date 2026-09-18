import React, { useState } from 'react';
import { Disc3, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Song } from '../../types';

interface SongArtworkProps {
  song: Song | null;
  isPlaying: boolean;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
  showToggle?: boolean;
}

const SongArtwork: React.FC<SongArtworkProps> = ({
  song,
  isPlaying,
  size = 'responsive',
  showToggle = false
}) => {
  const [viewMode, setViewMode] = useState<'vinyl' | 'square'>('vinyl');

  const imageUrl = song?.cover_art || song?.album_cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80';
  const songTitle = song?.title || 'Playing track';

  // Sizing styles
  const sizeClasses = {
    sm: 'w-24 h-24 sm:w-28 sm:h-28',
    md: 'w-48 h-48 sm:w-56 sm:h-56',
    lg: 'w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96',
    responsive: 'w-60 h-60 sm:w-72 sm:h-72 md:w-84 md:h-84 lg:w-96 lg:h-96'
  }[size];

  return (
    <div className="relative flex flex-col items-center justify-center select-none group">
      {/* Vinyl Disc View (Inspired by reference image) */}
      {viewMode === 'vinyl' ? (
        <div className={`relative ${sizeClasses} transition-transform duration-500`}>
          {/* Ambient Glow behind vinyl */}
          <div 
            className="absolute inset-4 rounded-full blur-2xl opacity-40 transition-opacity duration-700 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, var(--glow-color, rgba(236,72,153,0.4)) 0%, transparent 70%)',
              transform: isPlaying ? 'scale(1.08)' : 'scale(1)'
            }}
          />

          {/* Rotating Vinyl Record Body */}
          <div
            className={`w-full h-full rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.85)] border-4 border-[#222226] relative overflow-hidden transition-all duration-700 ${
              isPlaying ? 'animate-spin-vinyl' : 'animate-spin-vinyl paused'
            }`}
            style={{
              background: `
                radial-gradient(circle at center, transparent 40%, rgba(255,255,255,0.04) 41%, transparent 42%),
                radial-gradient(circle at center, transparent 48%, rgba(255,255,255,0.03) 49%, transparent 50%),
                radial-gradient(circle at center, transparent 56%, rgba(255,255,255,0.03) 57%, transparent 58%),
                radial-gradient(circle at center, transparent 64%, rgba(255,255,255,0.03) 65%, transparent 66%),
                radial-gradient(circle at center, transparent 72%, rgba(255,255,255,0.03) 73%, transparent 74%),
                radial-gradient(circle at center, transparent 80%, rgba(255,255,255,0.03) 81%, transparent 82%),
                radial-gradient(circle at center, transparent 88%, rgba(255,255,255,0.03) 89%, transparent 90%),
                conic-gradient(from 0deg, #111115 0deg, #28282f 45deg, #111115 90deg, #24242b 135deg, #111115 180deg, #28282f 225deg, #111115 270deg, #24242b 315deg, #111115 360deg)
              `
            }}
          >
            {/* Gloss light reflection cones across the vinyl record grooves */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none opacity-25"
              style={{
                background: 'conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.2) 20deg, transparent 40deg, transparent 180deg, rgba(255,255,255,0.2) 200deg, transparent 220deg)'
              }}
            />

            {/* Concentric grooved tracks overlay */}
            <div className="absolute inset-[8%] rounded-full border border-white/[0.07] pointer-events-none" />
            <div className="absolute inset-[15%] rounded-full border border-white/[0.06] pointer-events-none" />
            <div className="absolute inset-[22%] rounded-full border border-white/[0.05] pointer-events-none" />

            {/* Center Label: Song Artwork */}
            <div className="absolute inset-[27%] rounded-full overflow-hidden border-2 border-[#161619] shadow-inner bg-black flex items-center justify-center">
              <img
                src={imageUrl}
                alt={songTitle}
                className="w-full h-full object-cover select-none pointer-events-none"
                loading="eager"
              />
              
              {/* Spindle hole in exact center */}
              <div className="absolute w-4 h-4 rounded-full bg-[#0a0a0c] border border-white/40 shadow-inner z-10" />
            </div>
          </div>
        </div>
      ) : (
        /* Alternative Modern Square Artwork View */
        <div className={`relative ${sizeClasses} rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/15 group`}>
          <img
            src={imageUrl}
            alt={songTitle}
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isPlaying ? 'scale-100' : 'scale-95 opacity-90'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/10 pointer-events-none" />
        </div>
      )}

      {/* Optional Mode Toggle Pill (Vinyl vs Square) */}
      {showToggle && (
        <button
          onClick={() => setViewMode(prev => prev === 'vinyl' ? 'square' : 'vinyl')}
          className="mt-3 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold text-white/80 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
          title="Switch artwork style"
        >
          {viewMode === 'vinyl' ? (
            <>
              <ImageIcon className="w-3 h-3 text-pink-400" />
              <span>Card View</span>
            </>
          ) : (
            <>
              <Disc3 className="w-3 h-3 text-emerald-400 animate-spin" />
              <span>Vinyl View</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default SongArtwork;
