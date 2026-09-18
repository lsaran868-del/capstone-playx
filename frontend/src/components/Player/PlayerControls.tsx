import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Heart, 
  PlusCircle, 
  Check 
} from 'lucide-react';
import { RepeatMode } from '../../context/PlayerContext';

interface PlayerControlsProps {
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isFavorite: boolean;
  onTogglePlay: () => void;
  onPlayPrevious: () => void;
  onPlayNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite: () => void;
  onAddToPlaylist?: () => void;
  variant?: 'compact' | 'expanded';
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  isShuffle,
  repeatMode,
  isFavorite,
  onTogglePlay,
  onPlayPrevious,
  onPlayNext,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  onAddToPlaylist,
  variant = 'expanded'
}) => {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 sm:gap-4 select-none">
        {/* Compact Previous */}
        <button
          onClick={onPlayPrevious}
          className="p-1.5 text-white/70 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/10"
          title="Previous Track"
          aria-label="Previous track"
        >
          <SkipBack className="w-5 h-5 fill-current" />
        </button>

        {/* Compact Play / Pause */}
        <button
          onClick={onTogglePlay}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, var(--primary-color, #ec4899), var(--secondary-color, #9333ea))'
          }}
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>

        {/* Compact Next */}
        <button
          onClick={onPlayNext}
          className="p-1.5 text-white/70 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/10"
          title="Next Track"
          aria-label="Next track"
        >
          <SkipForward className="w-5 h-5 fill-current" />
        </button>
      </div>
    );
  }

  // Expanded Mode (Inspired directly by the reference image with central large Play button)
  return (
    <div className="w-full flex items-center justify-between sm:justify-around px-2 py-4 select-none">
      {/* 1. Favorite / Like Button */}
      <button
        onClick={onToggleFavorite}
        className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer ${
          isFavorite
            ? 'text-rose-500 scale-110 shadow-sm'
            : 'text-white/70 hover:text-white hover:scale-105 active:scale-95'
        }`}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart className={`w-6 h-6 sm:w-7 sm:h-7 transition-all ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* 2. Shuffle Button */}
      <button
        onClick={onToggleShuffle}
        className={`p-2.5 rounded-full transition-all relative flex flex-col items-center justify-center cursor-pointer ${
          isShuffle
            ? 'text-emerald-400 hover:scale-110'
            : 'text-white/70 hover:text-white hover:scale-105 active:scale-95'
        }`}
        title={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
        aria-label="Toggle shuffle"
      >
        <Shuffle className="w-5 h-5 sm:w-6 sm:h-6" />
        {isShuffle && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5" />
        )}
      </button>

      {/* 3. Previous Track Button */}
      <button
        onClick={onPlayPrevious}
        className="p-2.5 text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer rounded-full hover:bg-white/10"
        title="Previous Track"
        aria-label="Previous track"
      >
        <SkipBack className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
      </button>

      {/* 4. Large Prominent Play/Pause Button (Matching Reference Image) */}
      <button
        onClick={onTogglePlay}
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-black flex items-center justify-center shadow-[0_10px_35px_rgba(0,0,0,0.7)] hover:scale-105 active:scale-95 transition-transform cursor-pointer border-2 border-white/80"
        title={isPlaying ? 'Pause' : 'Play'}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="w-8 h-8 sm:w-9 sm:h-9 fill-black" />
        ) : (
          <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-black ml-1" />
        )}
      </button>

      {/* 5. Next Track Button */}
      <button
        onClick={onPlayNext}
        className="p-2.5 text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer rounded-full hover:bg-white/10"
        title="Next Track"
        aria-label="Next track"
      >
        <SkipForward className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
      </button>

      {/* 6. Repeat Button */}
      <button
        onClick={onToggleRepeat}
        className={`p-2.5 rounded-full transition-all relative flex flex-col items-center justify-center cursor-pointer ${
          repeatMode !== 'off'
            ? 'text-emerald-400 hover:scale-110'
            : 'text-white/70 hover:text-white hover:scale-105 active:scale-95'
        }`}
        title={`Repeat: ${repeatMode}`}
        aria-label="Toggle repeat"
      >
        {repeatMode === 'one' ? (
          <Repeat1 className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <Repeat className="w-5 h-5 sm:w-6 sm:h-6" />
        )}
        {repeatMode !== 'off' && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5" />
        )}
      </button>

      {/* 7. Add to Playlist Button (Matching Reference Image '+') */}
      {onAddToPlaylist && (
        <button
          onClick={onAddToPlaylist}
          className="p-2.5 text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer rounded-full"
          title="Add to Playlist"
          aria-label="Add to playlist"
        >
          <PlusCircle className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      )}
    </div>
  );
};

export default PlayerControls;
