import React from 'react';

interface BlackHoleHeroDisplayProps {
  timeline: number; // 0.0 to 8.0s
  phase: 'space_awakening' | 'gravitational_pull' | 'semicircle_emergence' | 'brand_lock' | 'warp_exit';
}

/**
 * BlackHoleHeroDisplay
 * Renders the user-provided black hole image with:
 * - Seamless cosmic feathering / radial vignette blending into the rotating galaxy
 * - Relativistic accretion heat shimmer and breathing pulse
 * - Blazing upper semicircle / photon ring arc overlay
 * - Singularity light rays & flare bursting from the semicircle as PLAYX arrives
 * - Graceful depth recede when PLAYX locks into the foreground
 */
export const BlackHoleHeroDisplay: React.FC<BlackHoleHeroDisplayProps> = ({ timeline, phase }) => {
  // Fade in during initial awakening (0.0s - 1.6s)
  const imageFade = Math.min(1.0, Math.max(0.0, (timeline - 0.2) / 1.4));

  // Accretion disk flare intensity
  let diskGlow = 1.0;
  if (timeline >= 2.0 && timeline <= 4.2) {
    const pullProgress = (timeline - 2.0) / 2.2;
    diskGlow = 1.0 + Math.sin(pullProgress * Math.PI) * 0.85; // Flares up to 1.85x
  } else if (timeline > 4.2 && timeline <= 6.0) {
    diskGlow = 1.25;
  }

  // Semicircle Singularity Eruption (t = 3.6s to 5.4s)
  // Radiant flare and light beams emerging directly from the upper semicircle
  const isSemicircleIgnited = timeline >= 3.4 && timeline <= 5.8;
  const semicircleProgress = Math.min(1.0, Math.max(0.0, (timeline - 3.4) / 1.8));
  const flareIntensity = isSemicircleIgnited
    ? Math.sin(semicircleProgress * Math.PI)
    : 0;

  // Background recede: As PLAYX emerges, black hole gently scales down to frame the logo
  let recedeScale = 1.0;
  if (timeline >= 4.2) {
    const recedeProg = Math.min(1.0, (timeline - 4.2) / 2.0);
    recedeScale = 1.0 - recedeProg * 0.08; // 1.0 -> 0.92
  }

  // Subtle breathing pulse simulating cosmic power
  const breathing = Math.sin(timeline * 1.8) * 0.012;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
      
      {/* 1. Deep Space Cosmic Nebular Core Glow behind the Black Hole */}
      <div 
        className="absolute w-[85vw] max-w-[1200px] h-[55vh] max-h-[600px] rounded-full pointer-events-none transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 140, 30, 0.22) 0%, rgba(180, 50, 240, 0.16) 42%, rgba(0, 240, 255, 0.08) 65%, transparent 80%)',
          filter: 'blur(60px)',
          opacity: imageFade * 0.9,
          transform: `scale(${1 + breathing * 2})`,
        }}
      />

      {/* 2. Main Black Hole Container with User-Provided Image */}
      <div 
        className="relative w-full max-w-[1280px] px-4 md:px-8 flex items-center justify-center transition-all duration-700"
        style={{
          opacity: imageFade,
          transform: `scale(${recedeScale + breathing})`,
          filter: `drop-shadow(0 0 60px rgba(255, 150, 30, ${0.35 * diskGlow})) drop-shadow(0 0 120px rgba(160, 40, 220, 0.25))`,
        }}
      >
        {/* The User-Provided Picture */}
        <div className="relative w-full aspect-[1024/440] overflow-hidden select-none">
          <img
            src="/images/playx_blackhole_intro.png"
            alt="PlayX Gargantua Black Hole"
            className="w-full h-full object-contain select-none pointer-events-none"
            style={{
              // Seamless elliptical gradient mask: eliminates hard rectangular edges
              WebkitMaskImage: 'radial-gradient(ellipse 84% 78% at 50% 50%, black 48%, rgba(0,0,0,0.85) 68%, transparent 98%)',
              maskImage: 'radial-gradient(ellipse 84% 78% at 50% 50%, black 48%, rgba(0,0,0,0.85) 68%, transparent 98%)',
              filter: `brightness(${0.9 + diskGlow * 0.18}) contrast(1.12) saturate(1.15)`,
            }}
          />

          {/* Dynamic Relativistic Accretion Shimmer Line */}
          <div 
            className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-500"
            style={{
              opacity: (diskGlow - 1.0) * 0.85,
              background: 'radial-gradient(ellipse 70% 8% at 50% 51%, rgba(255, 230, 180, 0.7) 0%, rgba(255, 120, 20, 0.4) 40%, transparent 80%)',
              filter: 'blur(6px)',
            }}
          />

          {/* ========================================================================= */}
          {/* 3. THE UPPER GLOWING SEMICIRCLE (Singularity Arrival Portal)              */}
          {/* Positioned precisely over the glowing upper arc / semicircle in the image */}
          {/* Center X: 50%, Top: ~32% to 48%                                           */}
          {/* ========================================================================= */}
          
          {/* Pulsing Semicircle Halo */}
          <div 
            className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 w-[22%] aspect-[2/1] rounded-t-full pointer-events-none transition-all duration-300"
            style={{
              borderTop: `${2 + flareIntensity * 4}px solid rgba(255, 255, 255, ${0.6 + flareIntensity * 0.4})`,
              boxShadow: `0 -4px ${20 + flareIntensity * 40}px rgba(255, 200, 100, ${0.5 + flareIntensity * 0.5}), inset 0 2px 15px rgba(255, 255, 255, 0.4)`,
              filter: `blur(${flareIntensity > 0.5 ? 2 : 1}px)`,
              opacity: Math.min(1.0, 0.4 + diskGlow * 0.4 + flareIntensity * 0.6),
            }}
          />

          {/* Singularity Flare & Volumetric Light Burst from within the Semicircle */}
          {isSemicircleIgnited && (
            <div 
              className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
              style={{
                opacity: flareIntensity,
                transform: `translate(-50%, -50%) scale(${0.4 + flareIntensity * 2.4})`,
                transition: 'transform 0.1s ease-out',
              }}
            >
              {/* Central Singularity Flash Point */}
              <div 
                className="w-16 h-16 sm:w-28 sm:h-28 rounded-full"
                style={{
                  background: 'radial-gradient(circle, #ffffff 0%, #ffe6a0 30%, #ff8c1a 60%, transparent 85%)',
                  boxShadow: '0 0 50px #ffffff, 0 0 90px #ff9e1b, 0 0 140px #00f0ff',
                  filter: 'blur(4px)',
                }}
              />

              {/* Radiant Anamorphic Horizontal Flare Lens Streak */}
              <div 
                className="absolute w-[450px] sm:w-[750px] h-[3px] sm:h-[5px] rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(0, 240, 255, 0.6) 20%, #ffffff 50%, rgba(255, 170, 40, 0.6) 80%, transparent 100%)',
                  boxShadow: '0 0 25px #ffffff, 0 0 50px rgba(0, 240, 255, 0.8)',
                  transform: `scaleX(${0.5 + flareIntensity * 1.8})`,
                  filter: 'blur(1px)',
                }}
              />

              {/* Vertical Radiant Singularity Beams */}
              <div 
                className="absolute w-[4px] sm:w-[6px] h-[220px] sm:h-[350px] rounded-full"
                style={{
                  background: 'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%)',
                  boxShadow: '0 0 20px #ffffff',
                  transform: `scaleY(${0.6 + flareIntensity * 1.5})`,
                  filter: 'blur(1.5px)',
                }}
              />

              {/* Diagonal Cross Rays */}
              <div 
                className="absolute w-[300px] h-[2px] rounded-full rotate-45"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 240, 200, 0.7) 50%, transparent 100%)',
                  filter: 'blur(2px)',
                }}
              />
              <div 
                className="absolute w-[300px] h-[2px] rounded-full -rotate-45"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 240, 200, 0.7) 50%, transparent 100%)',
                  filter: 'blur(2px)',
                }}
              />
            </div>
          )}

          {/* Expanding Relativistic Gravitational Shockwave Rings from Semicircle */}
          {timeline >= 3.8 && timeline <= 5.2 && (
            <div 
              className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/90 pointer-events-none"
              style={{
                width: `${80 + (timeline - 3.8) * 380}px`,
                height: `${80 + (timeline - 3.8) * 380}px`,
                opacity: Math.max(0, 1.0 - (timeline - 3.8) * 0.75),
                boxShadow: '0 0 35px rgba(255, 255, 255, 0.85), inset 0 0 25px rgba(255, 170, 50, 0.6)',
              }}
            />
          )}

        </div>
      </div>

    </div>
  );
};

export default BlackHoleHeroDisplay;
