import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Song } from '../types';
import api from '../services/api';

interface PlayerContextType {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  playSong: (song: Song, newQueue?: Song[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setVolume: (vol: number) => void;
  seekTo: (time: number) => void;
  toggleFavorite: (songId: string) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSongRef = useRef<Song | null>(null);
  const queueRef = useRef<Song[]>([]);
  const isShuffleRef = useRef(false);
  const isRepeatRef = useRef(false);
  const volumeRef = useRef(0.8);
  const loadedSongIdRef = useRef<string | null>(null);
  const playNextRef = useRef<() => void>(() => {});

  // Keep event handlers up to date without recreating the Audio instance.
  currentSongRef.current = currentSong;
  queueRef.current = queue;
  isShuffleRef.current = isShuffle;
  isRepeatRef.current = isRepeat;
  volumeRef.current = volume;

  // Create exactly one HTMLAudioElement for the lifetime of the provider.
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
      if (isRepeatRef.current) {
        audio.currentTime = 0;
        // This is the only automatic replay: the user explicitly enabled repeat.
        audio.play().catch(console.error);
      } else {
        // Advancing after a natural end intentionally switches to the next song.
        playNextRef.current();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audioRef.current = null;
    };
  }, []);

  const playSong = async (song: Song, newQueue?: Song[]) => {
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
    } else if (!queue.some(s => s.id === song.id)) {
      setQueue(prev => [...prev, song]);
    }

    setCurrentSong(song);

    const audio = audioRef.current;
    if (audio) {
      if (loadedSongIdRef.current !== song.id) {
        // Stop the previous source before replacing it, then reset progress for
        // the intentionally selected song.
        audio.pause();
        audio.src = song.audio_url || `/api/songs/${song.id}/stream`;
        audio.load();
        loadedSongIdRef.current = song.id;
        setCurrentTime(0);
        setDuration(song.duration || 0);
      }
      audio.volume = volumeRef.current;
      // playSong is called only from an explicit song/next/previous selection.
      audio.play().catch(err => console.log('Unable to play selected song:', err));
    }

    // Record listening history & play count
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
      // Resume is only initiated by this explicit Play click.
      audio.play().catch(console.error);
    }
  };

  const playNext = () => {
    const activeQueue = queueRef.current;
    const activeSong = currentSongRef.current;
    if (activeQueue.length === 0 || !activeSong) return;

    let nextIndex = 0;
    const currentIndex = activeQueue.findIndex(s => s.id === activeSong.id);

    if (isShuffleRef.current) {
      nextIndex = Math.floor(Math.random() * activeQueue.length);
    } else {
      nextIndex = (currentIndex + 1) % activeQueue.length;
    }

    playSong(activeQueue[nextIndex]);
  };

  playNextRef.current = playNext;

  const playPrevious = () => {
    const activeQueue = queueRef.current;
    const activeSong = currentSongRef.current;
    if (activeQueue.length === 0 || !activeSong) return;

    let prevIndex = 0;
    const currentIndex = activeQueue.findIndex(s => s.id === activeSong.id);

    if (isShuffleRef.current) {
      prevIndex = Math.floor(Math.random() * activeQueue.length);
    } else {
      prevIndex = (currentIndex - 1 + activeQueue.length) % activeQueue.length;
    }

    playSong(activeQueue[prevIndex]);
  };

  const toggleShuffle = () => {
    setIsShuffle(prev => !prev);
  };

  const toggleRepeat = () => {
    setIsRepeat(prev => !prev);
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

  const toggleFavorite = async (songId: string) => {
    try {
      const isFav = currentSong?.id === songId ? currentSong.is_favorite : false;
      if (isFav) {
        await api.delete(`/favorites/${songId}`);
      } else {
        await api.post(`/favorites/${songId}`);
      }

      if (currentSong && currentSong.id === songId) {
        setCurrentSong({ ...currentSong, is_favorite: !isFav });
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  return (
    <PlayerContext.Provider value={{
      currentSong,
      queue,
      isPlaying,
      isShuffle,
      isRepeat,
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
      toggleFavorite
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
