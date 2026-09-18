import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface StarryBackgroundProps {
  accentGlow?: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  twinklePhase: number;
  twinkleSpeed: number;
  color: string;
}

const StarryBackground: React.FC<StarryBackgroundProps> = ({ accentGlow }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color palette based on current theme
    const starColors =
      theme === 'cyber'
        ? ['#00f0ff', '#ffffff', '#a855f7', '#7dd3fc', '#38bdf8']
        : theme === 'light'
        ? ['#ffffff', '#f472b6', '#c084fc', '#e0e7ff', '#cbd5e1']
        : ['#ffffff', '#f472b6', '#a855f7', '#ffd6e7', '#e9d5ff'];

    // Generate stars with depth layers
    const starCount = Math.min(Math.floor((width * height) / 3800), 220);
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.15 + 0.05,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      });
    }

    // Shooting stars
    interface ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      active: boolean;
    }

    let shootingStar: ShootingStar = {
      x: 0,
      y: 0,
      length: 0,
      speed: 0,
      opacity: 0,
      active: false
    };

    const triggerShootingStar = () => {
      if (shootingStar.active) return;
      shootingStar = {
        x: Math.random() * width * 0.8,
        y: Math.random() * height * 0.4,
        length: Math.random() * 80 + 50,
        speed: Math.random() * 10 + 12,
        opacity: 1,
        active: true
      };
    };

    const shootingStarInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        triggerShootingStar();
      }
    }, 4500);

    // Animation render loop
    let tick = 0;
    const render = () => {
      tick += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Deep cosmic gradient
      const bgGradient = ctx.createRadialGradient(
        width / 2,
        height * 0.4,
        50,
        width / 2,
        height / 2,
        Math.max(width, height)
      );

      if (theme === 'cyber') {
        bgGradient.addColorStop(0, '#0a1628');
        bgGradient.addColorStop(0.5, '#040b17');
        bgGradient.addColorStop(1, '#02050b');
      } else if (theme === 'light') {
        bgGradient.addColorStop(0, '#1c1032');
        bgGradient.addColorStop(0.5, '#120822');
        bgGradient.addColorStop(1, '#090312');
      } else {
        // Dark / Midnight Violet
        bgGradient.addColorStop(0, '#1a0728');
        bgGradient.addColorStop(0.5, '#10031a');
        bgGradient.addColorStop(1, '#07010b');
      }

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Render nebula dust glows
      const nebulaGradient1 = ctx.createRadialGradient(
        width * 0.25,
        height * 0.35,
        0,
        width * 0.25,
        height * 0.35,
        width * 0.45
      );
      nebulaGradient1.addColorStop(0, theme === 'cyber' ? 'rgba(0, 240, 255, 0.08)' : 'rgba(236, 72, 153, 0.12)');
      nebulaGradient1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nebulaGradient1;
      ctx.fillRect(0, 0, width, height);

      const nebulaGradient2 = ctx.createRadialGradient(
        width * 0.75,
        height * 0.65,
        0,
        width * 0.75,
        height * 0.65,
        width * 0.4
      );
      nebulaGradient2.addColorStop(0, theme === 'cyber' ? 'rgba(168, 85, 247, 0.08)' : 'rgba(147, 51, 234, 0.1)');
      nebulaGradient2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nebulaGradient2;
      ctx.fillRect(0, 0, width, height);

      // Render twinkling stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.twinklePhase += star.twinkleSpeed;
        const currentAlpha = Math.max(
          0.1,
          star.alpha * (0.6 + 0.4 * Math.sin(star.twinklePhase))
        );

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha;
        ctx.shadowBlur = star.size > 1.8 ? 8 : 2;
        ctx.shadowColor = star.color;
        ctx.fill();

        // Slow drift
        star.y -= star.speed;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }
      }

      // Render shooting star if active
      if (shootingStar.active) {
        ctx.beginPath();
        ctx.moveTo(shootingStar.x, shootingStar.y);
        const tailX = shootingStar.x - shootingStar.length;
        const tailY = shootingStar.y - shootingStar.length * 0.6;
        ctx.lineTo(tailX, tailY);

        const starGrad = ctx.createLinearGradient(
          shootingStar.x,
          shootingStar.y,
          tailX,
          tailY
        );
        starGrad.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.opacity})`);
        starGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = starGrad;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.stroke();

        shootingStar.x += shootingStar.speed;
        shootingStar.y += shootingStar.speed * 0.6;
        shootingStar.opacity -= 0.015;

        if (shootingStar.opacity <= 0 || shootingStar.x > width) {
          shootingStar.active = false;
        }
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(shootingStarInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme, accentGlow]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
};

export default StarryBackground;
