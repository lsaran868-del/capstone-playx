import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import MiniPlayer from './MiniPlayer';
import ExpandedPlayer from './ExpandedPlayer';

const MusicPlayer: React.FC = () => {
  const { currentSong, isNowPlayingOpen, openNowPlaying, closeNowPlaying } = usePlayer();
  const [showQueue, setShowQueue] = useState(false);

  if (!currentSong) return null;

  return (
    <>
      {/* 1. Mini Bottom Music Player */}
      <MiniPlayer
        onOpenExpanded={openNowPlaying}
        onToggleQueue={() => setShowQueue(prev => !prev)}
        showQueue={showQueue}
      />

      {/* 2. Full-Screen Expanded Music Player (with Starry Background & Vinyl Record) */}
      {isNowPlayingOpen && (
        <ExpandedPlayer onClose={closeNowPlaying} />
      )}
    </>
  );
};

export default MusicPlayer;
