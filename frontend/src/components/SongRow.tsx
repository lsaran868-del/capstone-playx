import React, { useState } from 'react';
import { Play, Heart, Plus, ListPlus, Trash2 } from 'lucide-react';
import { Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import AddToPlaylistModal from './Modals/AddToPlaylistModal';

interface SongRowProps {
  song: Song;
  index: number;
  queue?: Song[];
  showRemove?: boolean;
  onRemove?: () => void;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const SongRow: React.FC<SongRowProps> = ({ song, index, queue = [], showRemove, onRemove }) => {
  const { currentSong, isPlaying, playSong, togglePlay, toggleFavorite, isFavorite, addToQueue } = usePlayer();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const isCurrent = currentSong?.id === song.id;
  const isFav = isFavorite(song.id);

  const handlePlayClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, queue.length > 0 ? queue : [song]);
    }
  };

  return (
    <>
      <div className="grid grid-cols-[16px_1fr_1fr_70px_auto] items-center gap-3 md:gap-4 px-3 md:px-4 py-2.5 rounded-xl hover:bg-muse-hover/50 group transition-colors select-none text-sm">
        {/* Index or Play indicator */}
        <div className="flex items-center justify-center">
          {isCurrent ? (
            isPlaying ? (
              <div className="flex items-end gap-0.5 h-4">
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
              </div>
            ) : (
              <Play className="w-4 h-4 fill-pink-500 text-pink-500" />
            )
          ) : (
            <>
              <span className="text-muse-subtext group-hover:hidden font-medium">{index + 1}</span>
              <button onClick={handlePlayClick} className="hidden group-hover:block text-white cursor-pointer">
                <Play className="w-4 h-4 fill-white" />
              </button>
            </>
          )}
        </div>

        {/* Title and Cover */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={song.cover_art || song.album_cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=100&q=80'}
            alt={song.title}
            className="w-10 h-10 rounded-lg object-cover border border-muse-border/40 shrink-0"
          />
          <div className="min-w-0">
            <h4 className={`font-semibold text-sm truncate ${isCurrent ? 'text-pink-400 font-bold' : 'text-white'}`}>
              {song.title}
            </h4>
            <p className="text-xs text-muse-subtext truncate group-hover:text-white transition-colors">
              {song.artist_name || 'Artist'}
            </p>
          </div>
        </div>

        {/* Album & Genre */}
        <div className="text-xs text-muse-subtext truncate">
          <span className="font-medium text-white/80">{song.album_title || 'Single'}</span>
          {song.genre_name && (
            <span className="hidden sm:inline text-muse-subtext/70 ml-2">• {song.genre_name}</span>
          )}
        </div>

        {/* Duration */}
        <div className="text-xs text-muse-subtext font-medium text-right pr-1">
          {formatTime(song.duration)}
        </div>

        {/* Action Menu (Heart, Add to Queue, Add to Playlist, Remove from Playlist) */}
        <div className="flex items-center justify-end gap-1.5 md:gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(song.id);
            }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isFav ? 'text-pink-500' : 'text-muse-subtext hover:text-white sm:opacity-0 sm:group-hover:opacity-100'
            }`}
            title={isFav ? "Unlike song" : "Like song"}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-pink-500 text-pink-500' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              addToQueue(song);
            }}
            className="p-1.5 rounded-lg text-muse-subtext hover:text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
            title="Add to queue"
          >
            <ListPlus className="w-4 h-4" />
          </button>

          {/* Add to playlist button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPlaylistModal(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muse-card/80 hover:bg-pink-500/20 text-muse-subtext hover:text-pink-400 border border-muse-border/40 hover:border-pink-500/40 text-xs font-semibold transition-all cursor-pointer"
            title="Add to playlist"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Playlist</span>
          </button>

          {/* Optional Remove button (for playlist view) */}
          {showRemove && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
              title="Remove from playlist"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Remove</span>
            </button>
          )}
        </div>
      </div>

      {showPlaylistModal && (
        <AddToPlaylistModal songId={song.id} onClose={() => setShowPlaylistModal(false)} />
      )}
    </>
  );
};

export default SongRow;
