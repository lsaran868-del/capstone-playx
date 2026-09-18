import React, { useState, useRef, useCallback } from 'react';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  showClefIndicator?: boolean;
  className?: string;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
  showClefIndicator = true,
  className = ''
}) => {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const activeDuration = duration > 0 ? duration : 180;
  const activeTime = isScrubbing ? scrubValue : currentTime;
  const progressPercent = Math.min(100, Math.max(0, (activeTime / activeDuration) * 100));

  const getTimeFromEvent = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      return ratio * activeDuration;
    },
    [activeDuration]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsScrubbing(true);
    const newTime = getTimeFromEvent(e.clientX);
    setScrubValue(newTime);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isScrubbing) {
      const newTime = getTimeFromEvent(e.clientX);
      setScrubValue(newTime);
    } else if (trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverPosition(ratio * activeDuration);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isScrubbing) {
      const finalTime = getTimeFromEvent(e.clientX);
      onSeek(finalTime);
      setIsScrubbing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSeek(Math.max(0, currentTime - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSeek(Math.min(activeDuration, currentTime + 5));
    }
  };

  return (
    <div className={`w-full flex flex-col space-y-2 select-none group ${className}`}>
      {/* Interactive Scrubber Track with Touch Target */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setHoverPosition(null)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-label="Seek track position"
        aria-valuemin={0}
        aria-valuemax={activeDuration}
        aria-valuenow={Math.round(activeTime)}
        aria-valuetext={`${formatTime(activeTime)} of ${formatTime(activeDuration)}`}
        className="relative w-full h-8 flex items-center cursor-pointer touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-lg"
      >
        {/* Background Track */}
        <div className="w-full h-1 sm:h-1.5 bg-white/20 group-hover:bg-white/30 rounded-full overflow-hidden transition-colors relative">
          {/* Progress Filled Track - Pure White with subtle glow */}
          <div
            className="h-full rounded-full transition-all duration-75 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
            style={{
              width: `${progressPercent}%`
            }}
          />
        </div>

        {/* Scrubber Knob / Musical Indicator (Treble Clef with pure white dot) */}
        <div
          className="absolute -translate-x-1/2 flex items-center justify-center pointer-events-none transition-transform duration-75"
          style={{ left: `${progressPercent}%` }}
        >
          {showClefIndicator ? (
            /* Musical Clef / Note indicator */
            <div className="relative flex flex-col items-center">
              <span className="text-xl sm:text-2xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] select-none font-serif leading-none filter hover:scale-125 transition-transform">
                𝄞
              </span>
              <div 
                className="w-2.5 h-2.5 rounded-full bg-white border border-black/20 shadow-[0_0_8px_rgba(255,255,255,1)] -mt-1"
              />
            </div>
          ) : (
            /* Sleek Modern Pure White Knob */
            <div 
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)] border-2 border-white/80 transition-transform group-hover:scale-125"
            />
          )}
        </div>

        {/* Hover Time Tooltip */}
        {hoverPosition !== null && !isScrubbing && (
          <div
            className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 text-white text-[10px] font-mono font-bold shadow-xl border border-white/10 pointer-events-none transition-opacity"
            style={{
              left: `${(hoverPosition / activeDuration) * 100}%`
            }}
          >
            {formatTime(hoverPosition)}
          </div>
        )}
      </div>

      {/* Timestamp Indicators (Current Time & Total Duration) */}
      <div className="flex items-center justify-between text-xs font-mono font-semibold text-white/70 px-1">
        <span className="tracking-wider">{formatTime(activeTime)}</span>
        <span className="tracking-wider">{formatTime(activeDuration)}</span>
      </div>
    </div>
  );
};

export default ProgressBar;
