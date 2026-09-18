import React from 'react';

interface PlayXLogoRevealProps {
  timeline: number; // 0.0 to 8.0s
  phase: 'space_awakening' | 'gravitational_pull' | 'semicircle_emergence' | 'brand_lock' | 'warp_exit';
}

/**
 * PlayXLogoReveal
 * Pure, minimalist, ultra-premium typography intro featuring ONLY the PLAYX name.
 * - Absolutely zero background elements or distractions (pure black backdrop)
 * - 8.0-second cinematic studio-grade typography reveal
 * - Smooth letter-by-letter 3D emergence with cinematic letter spacing
 * - Brilliant luminous light sweep gliding across the PLAYX name
 * - Signature radiant 'X' with ambient neon aura
 */
export const PlayXLogoReveal: React.FC<PlayXLogoRevealProps> = ({ timeline }) => {
  // Timeline phases across 8.0s:
  // 0.0s - 1.2s: Darkness / anticipation
  // 1.2s - 3.4s: Letters P-L-A-Y-X emerge sequentially from the dark
  // 3.4s - 5.6s: Luminous specular light beam glides across the letters
  // 5.6s - 7.2s: Full PLAYX name locked in pristine, heroic clarity
  // 7.2s - 8.0s: Seamless cinematic transition
  if (timeline < 0.6) return null;

  const getSubProgress = (start: number, end: number) => {
    return Math.min(1.0, Math.max(0.0, (timeline - start) / (end - start)));
  };

  // Letter emergence progress (staggered across 1.2s to 3.2s)
  const pP = getSubProgress(1.2, 2.2);
  const pL = getSubProgress(1.4, 2.4);
  const pA = getSubProgress(1.6, 2.6);
  const pY = getSubProgress(1.8, 2.8);
  const pX = getSubProgress(2.0, 3.0);
  const pTagline = getSubProgress(4.2, 5.2);

  // Specular light sweep progress (glides across text from 3.2s to 5.6s)
  const pSweep = getSubProgress(3.2, 5.6);
  const sweepPercent = pSweep * 140 - 20; // -20% to 120%

  // Master container scale and tracking expansion
  const pMaster = getSubProgress(1.0, 7.2);
  // Gentle camera zoom: 0.95 -> 1.05
  const masterScale = 0.95 + pMaster * 0.08;

  // Letter styling calculation
  const getLetterStyle = (prog: number, delayIndex: number) => {
    const ease = springEase(prog);
    const zTranslate = (1.0 - prog) * -180;
    const yTranslate = (1.0 - prog) * 20;
    const blur = (1.0 - prog) * 14;
    const opacity = Math.min(1.0, prog * 1.8);

    return {
      transform: `perspective(1000px) translate3d(0px, ${yTranslate}px, ${zTranslate}px) scale(${ease})`,
      filter: blur > 0.3 ? `blur(${blur}px)` : 'none',
      opacity,
      transition: 'opacity 0.1s linear',
    };
  };

  return (
    <div className="relative flex flex-col items-center justify-center pointer-events-none z-30 select-none px-4">
      
      {/* 1. Subtle Radial Ambient Lighting behind PLAYX */}
      <div 
        className="absolute w-[600px] sm:w-[900px] h-[300px] sm:h-[450px] rounded-full pointer-events-none transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 170, 50, 0.14) 0%, rgba(147, 51, 234, 0.09) 45%, transparent 75%)',
          filter: 'blur(60px)',
          opacity: timeline >= 2.0 ? Math.min(1.0, (timeline - 2.0) / 1.5) : 0,
        }}
      />

      {/* 2. THE PLAYX NAME ONLY */}
      <div 
        className="relative flex flex-col items-center justify-center"
        style={{ transform: `scale(${masterScale})` }}
      >
        <div className="relative flex items-center justify-center font-display font-black text-7xl sm:text-8xl md:text-9xl lg:text-[11rem] tracking-[0.08em] sm:tracking-[0.14em] leading-none">
          
          {/* 'P' */}
          <span 
            className="inline-block text-white"
            style={{
              ...getLetterStyle(pP, 0),
              textShadow: timeline >= 5.0 
                ? '0 0 40px rgba(255, 255, 255, 0.8), 0 0 80px rgba(255, 170, 50, 0.3)' 
                : '0 0 30px rgba(255, 255, 255, 0.9)',
            }}
          >
            P
          </span>

          {/* 'L' */}
          <span 
            className="inline-block text-white"
            style={{
              ...getLetterStyle(pL, 1),
              textShadow: timeline >= 5.0 
                ? '0 0 40px rgba(255, 255, 255, 0.8), 0 0 80px rgba(255, 170, 50, 0.3)' 
                : '0 0 30px rgba(255, 255, 255, 0.9)',
            }}
          >
            L
          </span>

          {/* 'A' */}
          <span 
            className="inline-block text-white"
            style={{
              ...getLetterStyle(pA, 2),
              textShadow: timeline >= 5.0 
                ? '0 0 40px rgba(255, 255, 255, 0.8), 0 0 80px rgba(255, 170, 50, 0.3)' 
                : '0 0 30px rgba(255, 255, 255, 0.9)',
            }}
          >
            A
          </span>

          {/* 'Y' */}
          <span 
            className="inline-block text-white"
            style={{
              ...getLetterStyle(pY, 3),
              textShadow: timeline >= 5.0 
                ? '0 0 40px rgba(255, 255, 255, 0.8), 0 0 80px rgba(255, 170, 50, 0.3)' 
                : '0 0 30px rgba(255, 255, 255, 0.9)',
            }}
          >
            Y
          </span>

          {/* 'X' (Signature Brand Gradient) */}
          <span 
            className="inline-block ml-1 bg-gradient-to-tr from-[#ffffff] via-[#ffaa33] to-[#00f0ff] bg-clip-text text-transparent"
            style={{
              ...getLetterStyle(pX, 4),
              filter: timeline >= 3.0 
                ? 'drop-shadow(0 0 35px rgba(255, 170, 50, 0.95)) drop-shadow(0 0 65px rgba(0, 240, 255, 0.85))' 
                : 'drop-shadow(0 0 40px rgba(255, 255, 255, 1.0))',
            }}
          >
            X
          </span>

          {/* 3. Luminous Specular Light Sweep across PLAYX (t = 3.2s – 5.6s) */}
          {pSweep > 0 && pSweep < 1 && (
            <div 
              className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen"
              style={{
                background: `linear-gradient(105deg, transparent ${sweepPercent - 15}%, rgba(255, 255, 255, 0.85) ${sweepPercent}%, rgba(0, 240, 255, 0.6) ${sweepPercent + 8}%, transparent ${sweepPercent + 20}%)`,
                WebkitMaskImage: 'linear-gradient(black, black)',
                maskImage: 'linear-gradient(black, black)',
              }}
            />
          )}

        </div>

        {/* 4. Minimalist Elegant Tagline Reveal (t = 4.2s - 8.0s) */}
        {pTagline > 0 && (
          <div 
            className="mt-6 sm:mt-8 text-center transition-all"
            style={{
              opacity: pTagline,
              transform: `translateY(${(1 - pTagline) * 10}px)`,
            }}
          >
            <p className="font-mono text-xs sm:text-sm tracking-[0.45em] sm:tracking-[0.6em] uppercase text-white/70 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
              Sound Beyond Horizons
            </p>
          </div>
        )}

      </div>

    </div>
  );
};

// Elastic spring overshoot easing
function springEase(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) * 0.12 + 1.0 - Math.pow(1 - x, 3) * 0.12;
}

export default PlayXLogoReveal;
