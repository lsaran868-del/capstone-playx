import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  MoreVertical, 
  Shuffle, 
  SkipBack, 
  Play, 
  Pause, 
  SkipForward, 
  Repeat, 
  Repeat1, 
  Heart, 
  Check, 
  Share2, 
  ListMusic, 
  Speaker, 
  Maximize2, 
  Minimize2, 
  X, 
  Plus, 
  Radio, 
  Music, 
  Volume2, 
  VolumeX,
  Sparkles,
  Disc3,
  Copy
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { getSongLyrics } from '../data/lyricsCatalog';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Playlist } from '../types';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const NowPlayingScreen: React.FC = () => {
  const {
    currentSong,
    queue,
    isPlaying,
    isShuffle,
    repeatMode,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    seekTo,
    isNowPlayingOpen,
    closeNowPlaying,
    playbackContext,
    isFavorite,
    toggleFavorite,
    playQueueItem,
    removeFromQueue,
    volume,
    setVolume
  } = usePlayer();

  const navigate = useNavigate();

  // Local UI state
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  const [showQueueSheet, setShowQueueSheet] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to Escape key to dismiss Now Playing screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNowPlayingOpen) {
        if (showFullLyrics) {
          setShowFullLyrics(false);
        } else if (showQueueSheet) {
          setShowQueueSheet(false);
        } else if (showDeviceModal) {
          setShowDeviceModal(false);
        } else {
          closeNowPlaying();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNowPlayingOpen, showFullLyrics, showQueueSheet, showDeviceModal, closeNowPlaying]);

  // Load user's playlists for "Add to playlist"
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

  if (!isNowPlayingOpen || !currentSong) return null;

  const isFav = isFavorite(currentSong.id);
  const lyricsLines = getSongLyrics(currentSong);
  const displayTime = isScrubbing ? scrubTime : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  const handleShare = async () => {
    const songUrl = window.location.origin + `/?song=${currentSong.id}`;
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
      setShowMenu(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to add to playlist';
      showToast(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#120a08] select-none overflow-hidden transition-all duration-300">
      {/* Dynamic Ambient Background Glow from Album Artwork */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 blur-3xl scale-125 transition-all duration-700"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, #682312 0%, #30110a 50%, #100605 100%)`,
        }}
      />
      {/* Blurred cover backdrop for authentic Spotify-like atmosphere */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-[90px] pointer-events-none scale-150 transition-all duration-700"
        style={{
          backgroundImage: `url(${currentSong.cover_art || currentSong.album_cover || ''})`,
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1ed760] text-black font-bold text-xs px-5 py-2.5 rounded-full shadow-2xl animate-fade-in flex items-center gap-2">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container - Centered and optimized for mobile-first with tablet/desktop responsiveness */}
      <div className="relative z-10 flex flex-col h-full max-w-md md:max-w-lg lg:max-w-xl mx-auto w-full px-6 py-4 justify-between overflow-y-auto no-scrollbar">
        
        {/* 1. Top Navigation Bar */}
        <header className="flex items-center justify-between pt-2 pb-3 shrink-0">
          {/* Back / Down Arrow Button */}
          <button
            onClick={closeNowPlaying}
            className="p-2 -ml-2 text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer rounded-full hover:bg-white/10"
            aria-label="Close Now Playing and return"
            title="Minimize"
          >
            <ChevronDown className="w-7 h-7 text-white" />
          </button>

          {/* Center Context Header */}
          <div className="text-center px-4 min-w-0 flex-1">
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-white/70 truncate">
              PLAYING FROM {playbackContext.type.toUpperCase()}
            </p>
            <h3 className="text-xs md:text-sm font-bold text-white truncate drop-shadow-sm mt-0.5">
              {playbackContext.name || currentSong.album_title || 'PlayX Favorites'}
            </h3>
          </div>

          {/* Three-Dot Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 -mr-2 text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer rounded-full hover:bg-white/10"
              aria-label="More options"
              title="Song options"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>

            {/* Options Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-10 w-56 bg-[#1f120e]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setShowPlaylistPicker(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Add to playlist</span>
                </button>

                {currentSong.artist_id && (
                  <button
                    onClick={() => {
                      closeNowPlaying();
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
                      closeNowPlaying();
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
                    setShowMenu(false);
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
                    setShowMenu(false);
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

        {/* 2. Prominent Center Album Artwork */}
        <div className="my-auto py-3 sm:py-5 flex items-center justify-center">
          <div className="relative w-full max-w-[310px] sm:max-w-[360px] aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 group">
            <img
              src={currentSong.cover_art || currentSong.album_cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'}
              alt={currentSong.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-100' : 'scale-[0.98] opacity-90'}`}
            />
            {/* Subtle gloss overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/10 pointer-events-none" />
          </div>
        </div>

        {/* 3. Song Details & Favorite Button Row */}
        <div className="flex items-center justify-between gap-4 pt-2 pb-4 shrink-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight truncate drop-shadow-md">
              {currentSong.title}
            </h1>
            <p 
              onClick={() => {
                if (currentSong.artist_id) {
                  closeNowPlaying();
                  navigate(`/artist/${currentSong.artist_id}`);
                }
              }}
              className="text-sm md:text-base font-medium text-white/70 truncate hover:text-white transition-colors cursor-pointer mt-0.5"
            >
              {currentSong.artist_name || 'Artist'}
            </p>
          </div>

          {/* Favorite / Like Button with Green Accent when Active */}
          <button
            onClick={() => toggleFavorite(currentSong.id)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 shadow-lg ${
              isFav
                ? 'bg-[#1ed760] text-black hover:scale-110 active:scale-95 shadow-[#1ed760]/30'
                : 'border-2 border-white/30 text-white/70 hover:text-white hover:border-white hover:scale-105 active:scale-95'
            }`}
            title={isFav ? 'Added to Liked Songs' : 'Add to Liked Songs'}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFav ? (
              <Check className="w-5 h-5 stroke-[3]" />
            ) : (
              <Heart className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* 4. Full-Width Progress Scrubber */}
        <div className="space-y-1.5 shrink-0 py-1">
          <div className="relative flex items-center group w-full py-1">
            {/* Custom Background Track */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white group-hover:bg-[#1ed760] transition-colors rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Range Input on Top */}
            <input
              type="range"
              min={0}
              max={duration || 180}
              value={displayTime}
              onMouseDown={() => setIsScrubbing(true)}
              onTouchStart={() => setIsScrubbing(true)}
              onChange={(e) => {
                const newTime = Number(e.target.value);
                setScrubTime(newTime);
                if (!isScrubbing) seekTo(newTime);
              }}
              onMouseUp={() => {
                seekTo(scrubTime);
                setIsScrubbing(false);
              }}
              onTouchEnd={() => {
                seekTo(scrubTime);
                setIsScrubbing(false);
              }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              aria-label="Playback progress"
            />
          </div>

          {/* Timers */}
          <div className="flex items-center justify-between text-[11px] font-mono text-white/60 font-semibold px-0.5">
            <span>{formatTime(displayTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 5. Main Playback Controls */}
        <div className="flex items-center justify-between py-2 sm:py-3 shrink-0">
          {/* Shuffle Button with Green Accent */}
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition-all relative flex flex-col items-center justify-center cursor-pointer ${
              isShuffle ? 'text-[#1ed760] hover:scale-110' : 'text-white/70 hover:text-white'
            }`}
            title={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
            aria-label="Toggle shuffle"
          >
            <Shuffle className="w-5 h-5 sm:w-6 sm:h-6" />
            {isShuffle && (
              <span className="w-1 h-1 rounded-full bg-[#1ed760] absolute -bottom-0.5" />
            )}
          </button>

          {/* Previous Button */}
          <button
            onClick={playPrevious}
            className="p-2 text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Previous track"
            aria-label="Previous track"
          >
            <SkipBack className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
          </button>

          {/* Large Circular Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={() => playNext(false)}
            className="p-2 text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Next track"
            aria-label="Next track"
          >
            <SkipForward className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
          </button>

          {/* Repeat Button with Green Accent */}
          <button
            onClick={toggleRepeat}
            className={`p-2 rounded-full transition-all relative flex flex-col items-center justify-center cursor-pointer ${
              repeatMode !== 'off' ? 'text-[#1ed760] hover:scale-110' : 'text-white/70 hover:text-white'
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
              <span className="w-1 h-1 rounded-full bg-[#1ed760] absolute -bottom-0.5" />
            )}
          </button>
        </div>

        {/* 6. Secondary Controls Row (Device, Share, Queue) */}
        <div className="flex items-center justify-between px-2 pt-1 pb-3 text-white/70 shrink-0">
          {/* Device Speaker Icon */}
          <button
            onClick={() => setShowDeviceModal(true)}
            className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer text-xs"
            title="Connect to a device"
            aria-label="Connect to a device"
          >
            <Speaker className="w-5 h-5" />
            <span className="hidden sm:inline text-[11px] font-semibold text-emerald-400">PlayX Web Player</span>
          </button>

          {/* Right Action Icons */}
          <div className="flex items-center gap-5">
            <button
              onClick={handleShare}
              className="p-1.5 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="Share song"
              aria-label="Share song"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowQueueSheet(true)}
              className="p-1.5 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer relative"
              title="Current queue"
              aria-label="Current queue"
            >
              <ListMusic className="w-5 h-5" />
              {queue.length > 1 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {queue.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 7. Lyrics Preview Card (Matching Reference Image) */}
        <div 
          onClick={() => setShowFullLyrics(true)}
          className="rounded-2xl sm:rounded-3xl bg-[#3c170f]/90 border border-white/10 p-4 sm:p-5 shadow-2xl cursor-pointer hover:bg-[#4a1d13] transition-all duration-200 group shrink-0 mb-2"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-white tracking-wide">
              Lyrics preview
            </h4>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 group-hover:text-white transition-colors flex items-center gap-1">
              <span>Full View</span>
              <Maximize2 className="w-3 h-3" />
            </span>
          </div>

          <div className="space-y-1 text-sm font-bold text-white/90 leading-relaxed max-h-24 overflow-hidden mask-bottom">
            {lyricsLines.slice(0, 4).map((line, idx) => (
              <p 
                key={idx} 
                className={`${idx === 0 ? 'text-white text-base' : 'text-white/70'} line-clamp-1`}
              >
                {line}
              </p>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 8. Full Lyrics Expanded View Modal */}
      {/* ========================================================================= */}
      {showFullLyrics && (
        <div className="fixed inset-0 z-50 bg-[#250d08] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#190805]">
            <div className="flex items-center gap-3">
              <img
                src={currentSong.cover_art || currentSong.album_cover}
                alt={currentSong.title}
                className="w-10 h-10 rounded-xl object-cover border border-white/20"
              />
              <div>
                <h3 className="font-bold text-sm text-white truncate max-w-[220px]">{currentSong.title}</h3>
                <p className="text-xs text-white/60">{currentSong.artist_name || 'Artist'}</p>
              </div>
            </div>
            <button
              onClick={() => setShowFullLyrics(false)}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Lyrics Content with scrolling and rich typography */}
          <div className="flex-1 overflow-y-auto p-8 max-w-xl mx-auto w-full space-y-5 text-center sm:text-left">
            <div className="pb-4">
              <span className="text-xs uppercase tracking-widest font-black text-amber-400">Song Lyrics</span>
            </div>
            {lyricsLines.map((line, i) => (
              <p
                key={i}
                className={`text-lg sm:text-xl font-black transition-colors ${
                  line.trim() === ""
                    ? "py-2"
                    : "text-white/80 hover:text-[#1ed760] cursor-pointer"
                }`}
              >
                {line}
              </p>
            ))}
            <div className="pt-12 pb-8 text-center text-xs text-white/40">
              Lyrics provided by PlayX Studio
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. Up Next Queue Drawer Sheet within Now Playing */}
      {/* ========================================================================= */}
      {showQueueSheet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#190d0a] border-l border-white/10 h-full flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-[#1ed760]" />
                <h3 className="font-bold text-base text-white">Up Next Queue</h3>
              </div>
              <button
                onClick={() => setShowQueueSheet(false)}
                className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-2">Currently Playing</p>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <img
                  src={currentSong.cover_art || currentSong.album_cover}
                  alt={currentSong.title}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-emerald-300 truncate">{currentSong.title}</p>
                  <p className="text-[10px] text-white/60 truncate">{currentSong.artist_name || 'Artist'}</p>
                </div>
              </div>

              <p className="text-[10px] font-black uppercase tracking-wider text-white/50 pt-4 mb-2">Next in Queue ({queue.length})</p>
              {queue.map((s, i) => {
                const isTrackCurrent = s.id === currentSong.id;
                return (
                  <div
                    key={`${s.id}-${i}`}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                      isTrackCurrent ? 'bg-white/10 text-emerald-400' : 'hover:bg-white/5 text-white/80'
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

      {/* ========================================================================= */}
      {/* 10. Device Connect Modal */}
      {/* ========================================================================= */}
      {showDeviceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1f100c] border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Speaker className="w-5 h-5 text-[#1ed760]" />
                <h3 className="font-bold text-sm text-white">Connect to a device</h3>
              </div>
              <button
                onClick={() => setShowDeviceModal(false)}
                className="p-1 text-white/60 hover:text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-white">PlayX Web Player (This Device)</p>
                  <p className="text-[10px] text-emerald-400">High Definition 320kbps Audio</p>
                </div>
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* Volume control inside device modal */}
            <div className="pt-2 border-t border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Output Volume</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setVolume(volume === 0 ? 0.8 : 0)}>
                  {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#1ed760]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. Add to Playlist Picker */}
      {/* ========================================================================= */}
      {showPlaylistPicker && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1f100c] border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
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
                    className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center gap-3 text-left transition-colors"
                  >
                    <img
                      src={pl.cover_art || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=100&q=80'}
                      alt={pl.name}
                      className="w-9 h-9 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-white truncate">{pl.name}</p>
                      <p className="text-[10px] text-white/50">{pl.songs_count || 0} songs</p>
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

export default NowPlayingScreen;
