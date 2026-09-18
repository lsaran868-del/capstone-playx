import React from 'react';
import MusicPlayer from './Player/MusicPlayer';

/**
 * Player component delegating to the modular MusicPlayer architecture
 * which manages MiniPlayer, ExpandedPlayer (Starry background, Vinyl Artwork),
 * ProgressBar, VolumeControl, and PlayerControls.
 */
const Player: React.FC = () => {
  return <MusicPlayer />;
};

export default Player;
