import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import PlayXLogoReveal from './intro/PlayXLogoReveal';

interface IntroScreenProps {
  onComplete: () => void;
}

export type IntroPhase = 
  | 'space_awakening' 
  | 'gravitational_pull' 
  | 'semicircle_emergence' 
  | 'brand_lock' 
  | 'warp_exit';

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  // 8.0s Total Cinematic Timeline
  // 0.0s - 2.0s: Space Awakening (Rotating galaxy and black hole fade in)
  // 2.0s - 4.0s: Gravitational Pull (Galaxy accelerates, matter spirals in, semicircle ignites)
  // 4.0s - 6.0s: Semicircle Emergence (PLAYX arrives out of the glowing semicircle)
  // 6.0s - 7.2s: Brand Lock (Heroic PLAYX lock with golden/cyan nebula halo)
  // 7.2s - 8.0s: Warp Exit (Smooth transition into the main application)
  const [timeline, setTimeline] = useState<number>(0);
  const [phase, setPhase] = useState<IntroPhase>('space_awakening');
  const [isExiting, setIsExiting] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);
  const animIdRef = useRef<number>(0);
  const hasFinishedRef = useRef<boolean>(false);

  // Procedural Web Audio API Cinematic Soundscape synchronized for 8 seconds
  const playCinematicSoundscape = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const now = ctx.currentTime;

      // 1. Deep Sub-bass Gravitational Drone (38Hz -> 58Hz) (0.0s -> 4.5s)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(38, now);
      subOsc.frequency.exponentialRampToValueAtTime(58, now + 4.0);

      subGain.gain.setValueAtTime(0.01, now);
      subGain.gain.linearRampToValueAtTime(0.25, now + 1.8);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 7.8);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 8.0);

      // 2. Gravitational Vortex Inward Sweep (2.0s -> 4.2s)
      const riseOsc = ctx.createOscillator();
      const riseGain = ctx.createGain();
      riseOsc.type = 'sawtooth';
      riseOsc.frequency.setValueAtTime(85, now + 2.0);
      riseOsc.frequency.exponentialRampToValueAtTime(520, now + 4.1);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now + 2.0);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 4.1);

      riseGain.gain.setValueAtTime(0.001, now + 2.0);
      riseGain.gain.linearRampToValueAtTime(0.18, now + 3.9);
      riseGain.gain.exponentialRampToValueAtTime(0.001, now + 4.6);

      riseOsc.connect(filter);
      filter.connect(riseGain);
      riseGain.connect(ctx.destination);
      riseOsc.start(now + 2.0);
      riseOsc.stop(now + 4.8);

      // 3. Singularity Light Burst & PLAYX Emergence Chord (at t = 4.0s)
      const chordNotes = [220, 277.18, 329.63, 440, 554.37, 659.25]; // Harmonic cosmic bloom
      chordNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 4.0);

        gain.gain.setValueAtTime(0.001, now + 4.0);
        gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), now + 4.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 7.9);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 4.0);
        osc.stop(now + 8.0);
      });
    } catch (err) {
      console.warn('AudioContext restricted:', err);
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted) {
      setIsMuted(false);
      playCinematicSoundscape();
    } else {
      setIsMuted(true);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    }
  };

  const finishIntro = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  useEffect(() => {
    startTimeRef.current = performance.now();

    const loop = (currentTime: number) => {
      const elapsedSec = (currentTime - startTimeRef.current) / 1000;
      setTimeline(elapsedSec);

      // 5-Stage 8-Second Cinematic Sequence
      if (elapsedSec < 2.0) {
        setPhase('space_awakening');
      } else if (elapsedSec < 4.0) {
        setPhase('gravitational_pull');
      } else if (elapsedSec < 6.0) {
        setPhase('semicircle_emergence');
      } else if (elapsedSec < 7.2) {
        setPhase('brand_lock');
      } else {
        setPhase('warp_exit');
      }

      // Exactly 8 seconds total duration
      if (elapsedSec >= 8.0 && !hasFinishedRef.current) {
        finishIntro();
        return;
      }

      animIdRef.current = requestAnimationFrame(loop);
    };

    animIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // Keyboard shortcuts: ESC, Space, Enter to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        finishIntro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Progress percentage across 8 seconds
  const progressPercent = Math.min(100, (timeline / 8.0) * 100);

  return (
    <div
      onClick={finishIntro}
      className={`fixed inset-0 z-[99999] bg-black flex items-center justify-center overflow-hidden select-none cursor-pointer transition-all duration-700 ${
        isExiting ? 'opacity-0 scale-105 filter blur-md pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Cinematic PLAYX Name Reveal Only */}
      <PlayXLogoReveal timeline={timeline} phase={phase} />

      {/* 4. Controls in the top bar */}
      <div 
        className="absolute top-6 left-6 right-6 flex items-center justify-between z-50 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Audio Toggle */}
        <button
          onClick={toggleSound}
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white/70 hover:text-white text-xs font-mono tracking-wider transition-all backdrop-blur-md"
          title={isMuted ? "Unmute Cosmic Audio" : "Mute Sound"}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-amber-400/80" />
              <span className="hidden sm:inline">Sound OFF</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline text-amber-300">Cosmic Audio ON</span>
            </>
          )}
        </button>

        {/* Skip Button */}
        <button
          onClick={finishIntro}
          type="button"
          className="px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white/60 hover:text-white text-xs font-mono tracking-widest uppercase transition-all backdrop-blur-md"
        >
          Skip <span className="text-[10px] text-white/40 ml-1">ESC</span>
        </button>
      </div>

      {/* 5. Minimal 8-Second Cosmic Progress Bar at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 pointer-events-none z-50">
        <div 
          className="h-full bg-gradient-to-r from-[#ffaa33] via-[#00f0ff] to-[#ffffff] transition-all duration-75 ease-linear shadow-[0_0_8px_#00f0ff]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default IntroScreen;
