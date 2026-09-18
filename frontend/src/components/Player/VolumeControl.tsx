import React, { useRef } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (vol: number) => void;
  className?: string;
  showSliderText?: boolean;
}

const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  onVolumeChange,
  className = '',
  showSliderText = false
}) => {
  const prevVolumeRef = useRef(volume > 0 ? volume : 0.8);

  const toggleMute = () => {
    if (volume > 0) {
      prevVolumeRef.current = volume;
      onVolumeChange(0);
    } else {
      onVolumeChange(prevVolumeRef.current || 0.8);
    }
  };

  const volumePercent = Math.round(volume * 100);

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Volume Icon Button */}
      <button
        onClick={toggleMute}
        className="text-white/70 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/10"
        title={volume === 0 ? 'Unmute' : 'Mute'}
        aria-label={volume === 0 ? 'Unmute volume' : 'Mute volume'}
      >
        {volume === 0 ? (
          <VolumeX className="w-5 h-5 text-rose-400" />
        ) : volume < 0.5 ? (
          <Volume1 className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </button>

      {/* Volume Slider Track */}
      <div className="relative w-24 sm:w-28 flex items-center group/vol py-2">
        <div className="w-full h-1 bg-white/20 group-hover/vol:bg-white/30 rounded-full overflow-hidden transition-colors">
          <div
            className="h-full rounded-full transition-all duration-75 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{
              width: `${volumePercent}%`
            }}
          />
        </div>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          aria-label="Volume level"
        />
      </div>

      {showSliderText && (
        <span className="text-[11px] font-mono text-white/50 w-8 text-right">
          {volumePercent}%
        </span>
      )}
    </div>
  );
};

export default VolumeControl;
