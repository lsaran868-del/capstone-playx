import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  ChevronUp, 
  ListMusic, 
  Maximize2 
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import VolumeControl from './VolumeControl';

interface MiniPlayerProps {
  onOpenExpanded: () => void;
  onToggleQueue?: () => void;
  showQueue?: boolean;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const MiniPlayer: React.FC<MiniPlayerProps> = ({
  onOpenExpanded,
  onToggleQueue,
  showQueue = false
}) => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    volume,
    setVolume,
    isFavorite,
    toggleFavorite
  } = usePlayer();

  if (!currentSong) return null;

  const isFav = isFavorite(currentSong.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const artworkUrl = currentSong.cover_art || currentSong.album_cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=100&q=80';

  return (
    <footer
      onClick={onOpenExpanded}
      className="fixed bottom-0 left-0 right-0 h-20 sm:h-24 bg-muse-dark/95 border-t border-muse-border/40 z-40 select-none glass-nav cursor-pointer group/player transition-all duration-200 hover:border-pink-500/30 px-3 sm:px-6"
      title="Click to expand full music player"
      role="region"
      aria-label="Audio player bar"
    >
      {/* Top Thin Progress Bar Line */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="absolute top-0 left-0 right-0 h-1 bg-white/10 group-hover/player:h-1.5 transition-all cursor-pointer"
      >
        <div
          className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-100"
          style={{
            width: `${progressPercent}%`
          }}
        />
        <input
          type="range"
          min={0}
          max={duration || 180}
          value={currentTime}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          aria-label="Seek track position"
        />
      </div>

      <div className="h-full flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
        {/* 1. Song Information & Artwork (Left) */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1 sm:flex-initial max-w-[55%] sm:max-w-[35%]">
          {/* Mini Vinyl / Artwork Thumbnail */}
          <div className="relative shrink-0 w-11 h-11 sm:w-14 sm:h-14 rounded-xl overflow-hidden shadow-lg border border-white/10 group-hover/player:border-pink-500/50 transition-all">
            <img
              src={artworkUrl}
              alt={currentSong.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100 opacity-90'
              }`}
            />
            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/player:opacity-100 flex items-center justify-center transition-opacity">
              <ChevronUp className="w-5 h-5 text-white animate-bounce" />
            </div>
          </div>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover/player:text-pink-300 transition-colors">
              {currentSong.title}
            </h4>
            <p className="text-[11px] sm:text-xs text-muse-subtext truncate mt-0.5">
              {currentSong.artist_name || 'Artist'}
            </p>
          </div>

          {/* Favorite Button (Hidden on ultra-narrow mobile, visible on 380px+) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(currentSong.id);
            }}
            className="hidden xs:flex p-1.5 text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform active:scale-125 ${isFav ? 'fill-pink-500 text-pink-500' : ''}`} />
          </button>
        </div>

        {/* 2. Central Playback Controls (Center) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 sm:gap-4 shrink-0 cursor-default"
        >
          {/* Previous (Hidden on tiny mobile) */}
          <button
            onClick={playPrevious}
            className="hidden sm:flex p-2 text-white/70 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/10"
            title="Previous Track"
            aria-label="Previous track"
          >
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>

          {/* Play / Pause Toggle Button */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, var(--primary-color, #ec4899), var(--secondary-color, #9333ea))'
            }}
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={() => playNext(false)}
            className="p-1.5 sm:p-2 text-white/70 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/10"
            title="Next Track"
            aria-label="Next track"
          >
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>
        </div>

        {/* 3. Right Volume, Queue & Expand Button */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 sm:gap-3 justify-end shrink-0 cursor-default"
        >
          {/* Volume Control (Desktop/Tablet) */}
          <div className="hidden md:flex items-center">
            <VolumeControl
              volume={volume}
              onVolumeChange={setVolume}
            />
          </div>

          {/* Queue Toggle Button */}
          {onToggleQueue && (
            <button
              onClick={onToggleQueue}
              className={`p-2 rounded-xl border transition-all cursor-pointer hidden sm:flex ${
                showQueue
                  ? 'bg-pink-500/20 text-pink-400 border-pink-500/40'
                  : 'bg-muse-dark/60 border-white/10 text-white/60 hover:text-white'
              }`}
              title="Toggle Queue"
              aria-label="Toggle queue"
            >
              <ListMusic className="w-4 h-4" />
            </button>
          )}

          {/* Explicit Expand Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenExpanded();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-pink-500/40 hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1 text-xs"
            title="Open full-screen music player"
            aria-label="Expand player"
          >
            <Maximize2 className="w-4 h-4 hidden sm:inline" />
            <ChevronUp className="w-4 h-4 sm:hidden" />
            <span className="hidden lg:inline font-semibold text-[11px]">Expand</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default MiniPlayer;
