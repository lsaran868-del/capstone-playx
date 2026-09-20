import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Song } from '../types';
import api, { getFullMediaUrl } from '../services/api';

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlaybackContextInfo {
  type: string;
  name: string;
}

interface PlayerContextType {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isRepeat: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  playSong: (song: Song, newQueue?: Song[], context?: PlaybackContextInfo | string) => void;
  togglePlay: () => void;
  playNext: (isAutoEnded?: boolean) => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setVolume: (vol: number) => void;
  seekTo: (time: number) => void;
  // Now Playing screen state
  isNowPlayingOpen: boolean;
  openNowPlaying: () => void;
  closeNowPlaying: () => void;
  toggleNowPlaying: () => void;
  playbackContext: PlaybackContextInfo;
  setPlaybackContext: (context: PlaybackContextInfo) => void;
  // Queue operations
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playQueueItem: (index: number) => void;
  // Favorite operations
  favoriteIds: Set<string>;
  isFavorite: (songId: string) => boolean;
  toggleFavorite: (songId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [volume, setVolumeState] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [playbackContext, setPlaybackContext] = useState<PlaybackContextInfo>({
    type: 'Playlist',
    name: 'PlayX Favorites',
  });

  const openNowPlaying = () => setIsNowPlayingOpen(true);
  const closeNowPlaying = () => setIsNowPlayingOpen(false);
  const toggleNowPlaying = () => setIsNowPlayingOpen(prev => !prev);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSongRef = useRef<Song | null>(null);
  const queueRef = useRef<Song[]>([]);
  const isShuffleRef = useRef(false);
  const repeatModeRef = useRef<RepeatMode>('off');
  const volumeRef = useRef(0.8);
  const loadedSongIdRef = useRef<string | null>(null);
  const shuffleHistoryRef = useRef<string[]>([]);
  const playNextRef = useRef<(isAutoEnded?: boolean) => void>(() => {});

  // Keep refs synchronized with state
  currentSongRef.current = currentSong;
  queueRef.current = queue;
  isShuffleRef.current = isShuffle;
  repeatModeRef.current = repeatMode;
  volumeRef.current = volume;

  const refreshFavorites = async () => {
    try {
      const res = await api.get('/favorites');
      if (Array.isArray(res.data)) {
        const ids = new Set<string>(res.data.map((f: any) => f.id));
        setFavoriteIds(ids);
      }
    } catch (e) {
      // Ignore if unauthenticated or on login screen
    }
  };

  useEffect(() => {
    refreshFavorites();
  }, []);

  // Initialize persistent audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 180);
    };

    const handleEnded = () => {
      const mode = repeatModeRef.current;
      if (mode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        playNextRef.current(true);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      const audio = audioRef.current;
      const song = currentSongRef.current;
      if (audio && song) {
        const streamEndpoint = getFullMediaUrl(`/api/songs/${song.id}/stream`);
        const localAudioFallback = getFullMediaUrl(`/audio/${song.id}.mp3`);
        const currentSrc = audio.src || '';
        if (!currentSrc.includes(streamEndpoint)) {
          console.warn(`Audio playback issue for "${song.title}", loading stream endpoint.`);
          audio.src = streamEndpoint;
          audio.load();
          audio.play().catch(() => {
            audio.src = localAudioFallback;
            audio.load();
            audio.play().catch(console.error);
          });
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, []);

  const playSong = async (
    song: Song,
    newQueue?: Song[],
    context?: PlaybackContextInfo | string
  ) => {
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
    } else if (!queue.some(s => s.id === song.id)) {
      setQueue(prev => [...prev, song]);
    }

    if (context) {
      if (typeof context === 'string') {
        setPlaybackContext({ type: 'Playlist', name: context });
      } else {
        setPlaybackContext(context);
      }
    } else if (song.album_title) {
      setPlaybackContext({ type: 'Album', name: song.album_title });
    } else {
      setPlaybackContext({ type: 'Playlist', name: 'PlayX Favorites' });
    }

    setCurrentSong(song);

    // Track for shuffle avoidance
    shuffleHistoryRef.current.push(song.id);
    if (shuffleHistoryRef.current.length > 20) {
      shuffleHistoryRef.current.shift();
    }

    const audio = audioRef.current;
    if (audio) {
      if (loadedSongIdRef.current !== song.id) {
        audio.pause();
        // Load through PLAYX internal streaming endpoint
        const targetAudioSrc = getFullMediaUrl(`/api/songs/${song.id}/stream`);
        audio.src = targetAudioSrc;
        audio.load();
        loadedSongIdRef.current = song.id;
        setCurrentTime(0);
        setDuration(song.duration || 0);
      }
      audio.volume = volumeRef.current;
      audio.play().catch(err => {
        console.log('Stream playback notice, checking fallback:', err);
        if (song.audio_url) {
          audio.src = getFullMediaUrl(song.audio_url);
          audio.load();
          audio.play().catch(console.error);
        }
      });
    }

    // Record listening history & play count in background
    try {
      await api.post(`/songs/${song.id}/play`);
    } catch (e) {
      // Ignore background tracking errors
    }
  };

  const togglePlay = () => {
    if (!currentSong) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  };

  const playNext = (isAutoEnded = false) => {
    const activeQueue = queueRef.current;
    const activeSong = currentSongRef.current;
    if (activeQueue.length === 0 || !activeSong) return;

    const currentIndex = activeQueue.findIndex(s => s.id === activeSong.id);

    if (isShuffleRef.current && activeQueue.length > 1) {
      // Pick random song from queue avoiding immediate repeats
      const unplayedCandidates = activeQueue.filter(s => s.id !== activeSong.id && !shuffleHistoryRef.current.slice(-3).includes(s.id));
      const pool = unplayedCandidates.length > 0 ? unplayedCandidates : activeQueue.filter(s => s.id !== activeSong.id);
      const nextSong = pool[Math.floor(Math.random() * pool.length)];
      playSong(nextSong);
      return;
    }

    // Normal sequential playback
    const isLastSong = currentIndex === activeQueue.length - 1;
    const mode = repeatModeRef.current;

    if (isLastSong) {
      if (mode === 'all') {
        // Repeat playlist loops back to first
        playSong(activeQueue[0]);
      } else if (isAutoEnded && mode === 'off') {
        // Stop at end if repeat is off and song ended naturally
        setIsPlaying(false);
      } else {
        // User clicked next manually
        playSong(activeQueue[0]);
      }
    } else {
      playSong(activeQueue[currentIndex + 1]);
    }
  };

  playNextRef.current = playNext;

  const playPrevious = () => {
    const activeQueue = queueRef.current;
    const activeSong = currentSongRef.current;
    if (activeQueue.length === 0 || !activeSong) return;

    const currentIndex = activeQueue.findIndex(s => s.id === activeSong.id);
    const prevIndex = (currentIndex - 1 + activeQueue.length) % activeQueue.length;
    playSong(activeQueue[prevIndex]);
  };

  const toggleShuffle = () => {
    setIsShuffle(prev => !prev);
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const setVolume = (vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Queue Operations
  const addToQueue = (song: Song) => {
    setQueue(prev => {
      if (prev.length === 0 && currentSong) {
        return [currentSong, song];
      }
      return [...prev, song];
    });
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    if (currentSong) {
      setQueue([currentSong]);
    } else {
      setQueue([]);
    }
  };

  const playQueueItem = (index: number) => {
    if (queue[index]) {
      playSong(queue[index]);
    }
  };

  // Global Favorite Operations
  const isFavorite = (songId: string) => favoriteIds.has(songId);

  const toggleFavorite = async (songId: string) => {
    const isFav = favoriteIds.has(songId);

    // Optimistic UI update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFav) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });

    if (currentSong && currentSong.id === songId) {
      setCurrentSong(prev => prev ? { ...prev, is_favorite: !isFav } : null);
    }

    try {
      if (isFav) {
        await api.delete(`/favorites/${songId}`);
      } else {
        await api.post(`/favorites/${songId}`);
      }
    } catch (err) {
      // Rollback on error
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (isFav) next.add(songId);
        else next.delete(songId);
        return next;
      });
      if (currentSong && currentSong.id === songId) {
        setCurrentSong(prev => prev ? { ...prev, is_favorite: isFav } : null);
      }
      console.error('Failed to toggle favorite:', err);
    }
  };

  return (
    <PlayerContext.Provider value={{
      currentSong,
      queue,
      isPlaying,
      isShuffle,
      repeatMode,
      isRepeat: repeatMode !== 'off',
      volume,
      currentTime,
      duration,
      playSong,
      togglePlay,
      playNext,
      playPrevious,
      toggleShuffle,
      toggleRepeat,
      setVolume,
      seekTo,
      isNowPlayingOpen,
      openNowPlaying,
      closeNowPlaying,
      toggleNowPlaying,
      playbackContext,
      setPlaybackContext,
      addToQueue,
      removeFromQueue,
      clearQueue,
      playQueueItem,
      favoriteIds,
      isFavorite,
      toggleFavorite,
      refreshFavorites
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
