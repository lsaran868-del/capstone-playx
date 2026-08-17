import React, { useState } from 'react';
import { Play, Pause, Heart, Plus } from 'lucide-react';
import { Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import AddToPlaylistModal from './Modals/AddToPlaylistModal';

interface SongRowProps {
  song: Song;
  index: number;
  queue?: Song[];
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const SongRow: React.FC<SongRowProps> = ({ song, index, queue = [] }) => {
  const { currentSong, isPlaying, playSong, togglePlay, toggleFavorite } = usePlayer();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const isCurrent = currentSong?.id === song.id;

  const handlePlayClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, queue.length > 0 ? queue : [song]);
    }
  };

  return (
    <>
      <div className="grid grid-cols-[16px_1fr_1fr_120px_40px] items-center gap-4 px-4 py-2.5 rounded-xl hover:bg-muse-hover/50 group transition-colors select-none text-sm">
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
              <button onClick={handlePlayClick} className="hidden group-hover:block text-white">
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

        {/* Album */}
        <div className="text-xs text-muse-subtext truncate">
          {song.album_title || 'Single'}
        </div>

        {/* Duration */}
        <div className="text-xs text-muse-subtext font-medium text-right pr-2">
          {formatTime(song.duration)}
        </div>

        {/* Action Menu (Heart & Add to Playlist) */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => toggleFavorite(song.id)}
            className="text-muse-subtext hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Like song"
          >
            <Heart className={`w-4 h-4 ${song.is_favorite ? 'fill-pink-500 text-pink-500 opacity-100' : ''}`} />
          </button>
          <button
            onClick={() => setShowPlaylistModal(true)}
            className="text-muse-subtext hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Add to playlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showPlaylistModal && (
        <AddToPlaylistModal songId={song.id} onClose={() => setShowPlaylistModal(false)} />
      )}
    </>
  );
};

export default SongRow;
