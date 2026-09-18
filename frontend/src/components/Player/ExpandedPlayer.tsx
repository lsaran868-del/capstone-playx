import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  MoreVertical, 
  Share2, 
  ListMusic, 
  Radio, 
  X, 
  Plus, 
  Music, 
  Disc3, 
  Sparkles, 
  Check, 
  Maximize2, 
  Minimize2,
  Volume2
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { getSongLyrics } from '../../data/lyricsCatalog';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Playlist } from '../../types';
import StarryBackground from './StarryBackground';
import SongArtwork from './SongArtwork';
import ProgressBar from './ProgressBar';
import PlayerControls from './PlayerControls';
import VolumeControl from './VolumeControl';

interface ExpandedPlayerProps {
  onClose: () => void;
}

const ExpandedPlayer: React.FC<ExpandedPlayerProps> = ({ onClose }) => {
  const {
    currentSong,
    queue,
    isPlaying,
    isShuffle,
    repeatMode,
    volume,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    seekTo,
    setVolume,
    playbackContext,
    isFavorite,
    toggleFavorite,
    playQueueItem,
    removeFromQueue
  } = usePlayer();

  const navigate = useNavigate();

  // Modals & Panels state
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Lock body & html scroll completely while expanded player is open so no scrollbar line shows
  useEffect(() => {
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
    };
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard shortcut listener (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showFullLyrics) setShowFullLyrics(false);
        else if (showQueueDrawer) setShowQueueDrawer(false);
        else if (showPlaylistPicker) setShowPlaylistPicker(false);
        else onClose();
      } else if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullLyrics, showQueueDrawer, showPlaylistPicker, onClose, togglePlay]);

  // Load playlists for Add to Playlist action
  useEffect(() => {
    if (showPlaylistPicker) {
      api.get('/playlists')
        .then(res => setPlaylists(res.data || []))
        .catch(console.error);
    }
  }, [showPlaylistPicker]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  if (!currentSong) return null;

  const isFav = isFavorite(currentSong.id);
  const lyricsLines = getSongLyrics(currentSong);

  const handleShare = async () => {
    const songUrl = `${window.location.origin}/?song=${currentSong.id}`;
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(songUrl);
        showToast(`Copied link to "${currentSong.title}"`);
      } catch {
        showToast(`Link: ${songUrl}`);
      }
    } else {
      showToast(`Link: ${songUrl}`);
    }
  };

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    try {
      await api.post(`/playlists/${playlistId}/songs`, { songId: currentSong.id });
      showToast(`Added to "${playlistName}"`);
      setShowPlaylistPicker(false);
      setShowOptionsMenu(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to add to playlist';
      showToast(msg);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-[#08020e] text-white select-none overflow-hidden animate-in fade-in duration-300 playx-now-playing-scope"
      role="dialog"
      aria-modal="true"
      aria-label={`Now Playing: ${currentSong.title}`}
    >
      {/* 1. STARRY COSMIC BACKGROUND (Active exclusively for this page as requested) */}
      <StarryBackground />

      {/* Dynamic blurred glow from the song's album artwork */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-[100px] pointer-events-none scale-150 transition-all duration-1000"
        style={{
          backgroundImage: `url(${currentSong.cover_art || currentSong.album_cover || ''})`
        }}
      />

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1ed760] text-black font-bold text-xs px-5 py-2.5 rounded-full shadow-2xl animate-fade-in flex items-center gap-2">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Main Player Viewport Container */}
      <div className="relative z-10 flex flex-col h-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto w-full px-4 sm:px-8 py-3 sm:py-5 justify-between overflow-y-auto no-scrollbar">
        
        {/* Header: Back arrow, Context ("Playing from..."), Three-dot menu */}
        <header className="flex items-center justify-between pt-1 shrink-0">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer rounded-full hover:bg-white/10"
            aria-label="Close music player"
            title="Minimize"
          >
            <ChevronDown className="w-7 h-7 text-white" />
          </button>

          <div className="text-center px-4 min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white/60 truncate">
              PLAYING FROM {playbackContext.type.toUpperCase()}
            </p>
            <h3 className="text-xs sm:text-sm font-bold text-white truncate drop-shadow mt-0.5">
              {playbackContext.name || currentSong.album_title || 'PLAYX Top Hits'}
            </h3>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 -mr-2 text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer rounded-full hover:bg-white/10"
              aria-label="Song options"
              title="More options"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>

            {/* Options Dropdown */}
            {showOptionsMenu && (
              <div className="absolute right-0 top-10 w-56 bg-[#160a22]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setShowPlaylistPicker(true);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Add to playlist</span>
                </button>

                {currentSong.artist_id && (
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/artist/${currentSong.artist_id}`);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                  >
                    <Disc3 className="w-4 h-4 text-purple-400" />
                    <span>View artist</span>
                  </button>
                )}

                {currentSong.album_id && (
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/album/${currentSong.album_id}`);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                  >
                    <Music className="w-4 h-4 text-pink-400" />
                    <span>View album</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    handleShare();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-sky-400" />
                  <span>Share track</span>
                </button>

                <div className="my-1 border-t border-white/10" />

                <button
                  onClick={() => {
                    setShowFullLyrics(true);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Full lyrics</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 3. Center: Prominent Vinyl Album Artwork */}
        <div className="my-auto py-3 sm:py-6 flex items-center justify-center">
          <SongArtwork
            song={currentSong}
            isPlaying={isPlaying}
            size="responsive"
            showToggle={true}
          />
        </div>

        {/* 4. Song Information (Title & Artist) */}
        <div className="text-center py-2 shrink-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase truncate drop-shadow-md">
            {currentSong.title}
          </h1>
          <p
            onClick={() => {
              if (currentSong.artist_id) {
                onClose();
                navigate(`/artist/${currentSong.artist_id}`);
              }
            }}
            className="text-xs sm:text-sm md:text-base font-semibold text-white/70 hover:text-white transition-colors cursor-pointer mt-1 truncate"
          >
            {currentSong.artist_name || 'Artist'}
          </p>
        </div>

        {/* 5. Full-Width Progress Bar with Treble Clef Indicator */}
        <div className="w-full py-1 shrink-0">
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={seekTo}
            showClefIndicator={true}
          />
        </div>

        {/* 6. Playback Controls (Matching Reference Image) */}
        <div className="w-full py-2 shrink-0">
          <PlayerControls
            isPlaying={isPlaying}
            isShuffle={isShuffle}
            repeatMode={repeatMode}
            isFavorite={isFav}
            onTogglePlay={togglePlay}
            onPlayPrevious={playPrevious}
            onPlayNext={() => playNext(false)}
            onToggleShuffle={toggleShuffle}
            onToggleRepeat={toggleRepeat}
            onToggleFavorite={() => toggleFavorite(currentSong.id)}
            onAddToPlaylist={() => setShowPlaylistPicker(true)}
            variant="expanded"
          />
        </div>

        {/* 7. Secondary Controls Row (Volume, Share, Queue) */}
        <div className="flex items-center justify-between px-3 py-2 text-white/70 shrink-0 border-t border-white/10">
          {/* Desktop/Tablet Volume Control */}
          <div className="flex items-center">
            <VolumeControl
              volume={volume}
              onVolumeChange={setVolume}
              showSliderText={false}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleShare}
              className="p-2 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer rounded-full"
              title="Share song"
              aria-label="Share song"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowQueueDrawer(true)}
              className="p-2 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer relative rounded-full"
              title="Queue"
              aria-label="View upcoming queue"
            >
              <ListMusic className="w-5 h-5" />
              {queue.length > 1 && (
                <span className="absolute 0 top-0.5 right-0.5 w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {queue.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 8. Lyrics Preview Card at Bottom */}
        <div
          onClick={() => setShowFullLyrics(true)}
          className="rounded-2xl sm:rounded-3xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 p-4 sm:p-5 shadow-2xl cursor-pointer transition-all duration-200 group shrink-0 mb-2 backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Lyrics preview</span>
            </h4>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 group-hover:text-white transition-colors flex items-center gap-1">
              <span>Full Lyrics</span>
              <Maximize2 className="w-3 h-3" />
            </span>
          </div>

          <div className="space-y-1 text-xs sm:text-sm font-semibold text-white/80 leading-relaxed max-h-20 overflow-hidden">
            {lyricsLines.slice(0, 3).map((line, idx) => (
              <p
                key={idx}
                className={`${idx === 0 ? 'text-white font-bold' : 'text-white/60'} line-clamp-1`}
              >
                {line}
              </p>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* FULL LYRICS MODAL OVERLAY */}
      {/* ========================================================= */}
      {showFullLyrics && (
        <div className="fixed inset-0 z-50 bg-[#0c0514]/95 backdrop-blur-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-3">
              <img
                src={currentSong.cover_art || currentSong.album_cover}
                alt={currentSong.title}
                className="w-10 h-10 rounded-xl object-cover border border-white/20"
              />
              <div>
                <h3 className="font-bold text-sm text-white truncate max-w-[240px]">{currentSong.title}</h3>
                <p className="text-xs text-white/60">{currentSong.artist_name || 'Artist'}</p>
              </div>
            </div>
            <button
              onClick={() => setShowFullLyrics(false)}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close lyrics"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 max-w-xl mx-auto w-full space-y-5 text-center sm:text-left">
            <div className="pb-3">
              <span className="text-xs uppercase tracking-widest font-black text-pink-400">Song Lyrics</span>
            </div>
            {lyricsLines.map((line, i) => (
              <p
                key={i}
                className={`text-lg sm:text-2xl font-black transition-colors ${
                  line.trim() === ''
                    ? 'py-2'
                    : 'text-white/80 hover:text-pink-300 cursor-pointer'
                }`}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* QUEUE DRAWER SHEET */}
      {/* ========================================================= */}
      {showQueueDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#12081c] border-l border-white/10 h-full flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-base text-white">Up Next Queue</h3>
              </div>
              <button
                onClick={() => setShowQueueDrawer(false)}
                className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-pink-400 mb-2">Currently Playing</p>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-pink-500/10 border border-pink-500/30">
                <img
                  src={currentSong.cover_art || currentSong.album_cover}
                  alt={currentSong.title}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-pink-300 truncate">{currentSong.title}</p>
                  <p className="text-[10px] text-white/60 truncate">{currentSong.artist_name || 'Artist'}</p>
                </div>
              </div>

              <p className="text-[10px] font-black uppercase tracking-wider text-white/50 pt-4 mb-2">
                Next in Queue ({queue.length})
              </p>
              {queue.map((s, i) => {
                const isTrackCurrent = s.id === currentSong.id;
                return (
                  <div
                    key={`${s.id}-${i}`}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                      isTrackCurrent ? 'bg-white/10 text-pink-400' : 'hover:bg-white/5 text-white/80'
                    }`}
                  >
                    <div
                      onClick={() => playQueueItem(i)}
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <span className="w-4 text-center font-mono text-[10px] text-white/40">{i + 1}</span>
                      <img
                        src={s.cover_art || s.album_cover}
                        alt={s.title}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate text-white">{s.title}</p>
                        <p className="text-[10px] text-white/50 truncate">{s.artist_name || 'Artist'}</p>
                      </div>
                    </div>

                    {!isTrackCurrent && (
                      <button
                        onClick={() => removeFromQueue(i)}
                        className="p-1 text-white/40 hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD TO PLAYLIST PICKER MODAL */}
      {/* ========================================================= */}
      {showPlaylistPicker && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a0c26] border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm text-white">Add to Playlist</h3>
              <button onClick={() => setShowPlaylistPicker(false)} className="p-1 text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5">
              {playlists.length > 0 ? (
                playlists.map(pl => (
                  <button
                    key={pl.id}
                    onClick={() => handleAddToPlaylist(pl.id, pl.name)}
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center gap-3 text-left transition-colors cursor-pointer"
                  >
                    <img
                      src={pl.cover_art || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=100&q=80'}
                      alt={pl.name}
                      className="w-9 h-9 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-white truncate">{pl.name}</p>
                      <p className="text-[10px] text-white/50">{pl.songs_count || pl.song_count || 0} songs</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-white/50 text-center py-6">No playlists found. Create one in your Library.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpandedPlayer;
