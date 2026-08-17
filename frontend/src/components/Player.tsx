import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Heart
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const Player: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    isShuffle,
    isRepeat,
    volume,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    setVolume,
    seekTo,
    toggleFavorite
  } = usePlayer();

  if (!currentSong) return null;

  return (
    <footer className="h-24 bg-muse-dark/95 border-t border-muse-border/40 px-6 grid grid-cols-3 items-center z-40 relative select-none glass-nav">
      {/* 1. Current Song Info */}
      <div className="flex items-center gap-4 min-w-0">
        <img
          src={currentSong.cover_art || currentSong.album_cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=100&q=80'}
          alt={currentSong.title}
          className="w-14 h-14 rounded-xl object-cover shadow-lg border border-muse-border/40 shrink-0"
        />
        <div className="min-w-0">
          <h4 className="font-bold text-sm text-white truncate hover:text-pink-300 cursor-pointer transition-colors">
            {currentSong.title}
          </h4>
          <p className="text-xs text-muse-subtext truncate hover:underline cursor-pointer mt-0.5">
            {currentSong.artist_name || 'Artist'}
          </p>
        </div>
        <button
          onClick={() => toggleFavorite(currentSong.id)}
          className="p-1.5 text-muse-subtext hover:text-white transition-colors"
          title={currentSong.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-5 h-5 ${currentSong.is_favorite ? 'fill-pink-500 text-pink-500' : ''}`} />
        </button>
      </div>

      {/* 2. Media Player Controls & Progress Slider */}
      <div className="flex flex-col items-center gap-2 max-w-xl w-full justify-self-center">
        <div className="flex items-center gap-6">
          <button
            onClick={toggleShuffle}
            className={`p-1 transition-colors ${isShuffle ? 'text-pink-400' : 'text-muse-subtext hover:text-white'}`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={playPrevious}
            className="text-muse-subtext hover:text-white transition-colors"
            title="Previous"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-pink-500/30"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <button
            onClick={playNext}
            className="text-muse-subtext hover:text-white transition-colors"
            title="Next"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-1 transition-colors ${isRepeat ? 'text-pink-400' : 'text-muse-subtext hover:text-white'}`}
            title="Repeat"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 w-full group">
          <span className="text-[11px] font-medium text-muse-subtext w-9 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full h-1 bg-muse-hover rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <span className="text-[11px] font-medium text-muse-subtext w-9">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. Volume Controller */}
      <div className="flex items-center gap-3 justify-end justify-self-end">
        <button
          onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
          className="text-muse-subtext hover:text-white transition-colors"
          title={volume === 0 ? 'Unmute' : 'Mute'}
        >
          {volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
        </button>

        <div className="w-28 flex items-center group">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-1 bg-muse-hover rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </footer>
  );
};

export default Player;
