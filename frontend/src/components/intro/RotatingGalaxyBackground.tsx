import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface RotatingGalaxyBackgroundProps {
  timeline: number; // 0.0 to 8.0s
  phase: 'space_awakening' | 'gravitational_pull' | 'semicircle_emergence' | 'brand_lock' | 'warp_exit';
}

/**
 * High-performance 3D Rotating Galaxy and Deep Space Atmosphere
 * - Logarithmic 4-arm spiral galaxy with 4,200+ stars
 * - Core cluster + galactic arms (cyan, magenta, purple, golden-white stars)
 * - Deep space drifting cosmic dust and nebula stars
 * - Continuous majestic rotation, accelerating during the gravitational pull
 * - Inward gravitational particle spiral towards the center
 */
export const RotatingGalaxyBackground: React.FC<RotatingGalaxyBackgroundProps> = ({ timeline }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const galaxyGroupRef = useRef<THREE.Group | null>(null);
  const accretionPointsRef = useRef<THREE.Points | null>(null);
  const accretionDataRef = useRef<Array<{ r: number; theta: number; z: number; speed: number; baseR: number }>>([]);
  const animIdRef = useRef<number>(0);
  const prevTimeRef = useRef<number>(performance.now());
  const currentRotationRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 28;

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: false,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    renderer.setClearColor(0x020108, 1);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const galaxyGroup = new THREE.Group();
    // Slight cinematic tilt to the galactic plane (viewed at ~35 degree angle)
    galaxyGroup.rotation.x = THREE.MathUtils.degToRad(38);
    galaxyGroup.rotation.y = THREE.MathUtils.degToRad(-15);
    scene.add(galaxyGroup);
    galaxyGroupRef.current = galaxyGroup;

    // --- 1. Circular Soft Star Particle Texture Generator ---
    const createStarTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.18, 'rgba(255, 245, 220, 0.9)');
      grad.addColorStop(0.45, 'rgba(160, 210, 255, 0.45)');
      grad.addColorStop(0.8, 'rgba(120, 70, 220, 0.12)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      return texture;
    };
    const starTexture = createStarTexture();

    // --- 2. Spiral Galaxy Star Formation (4,200 Stars) ---
    const starCount = 4200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    const numArms = 4;
    const armSpread = 0.42;

    const colorCore = new THREE.Color('#fff2cc');     // Warm radiant core
    const colorGold = new THREE.Color('#ffb347');     // Inner arm golden
    const colorCyan = new THREE.Color('#00f0ff');     // Spiral arm cyan
    const colorMagenta = new THREE.Color('#d946ef');  // Starburst magenta
    const colorBlue = new THREE.Color('#60a5fa');     // Deep space outer blue

    for (let i = 0; i < starCount; i++) {
      // Radius distribution: dense near core, stretching to R = 32
      const radius = Math.pow(Math.random(), 1.8) * 32.0;

      // Spiral arm calculation: theta = armOffset + spiralCurvature
      const armIndex = i % numArms;
      const armAngle = (armIndex / numArms) * Math.PI * 2;
      const spiralCurvature = radius * 0.32;
      const theta = armAngle + spiralCurvature;

      // Random gaussian scattering around the arm spine
      const spread = (1 - Math.exp(-radius * 0.15)) * armSpread * radius;
      const xSpread = (Math.random() - 0.5) * spread;
      const ySpread = (Math.random() - 0.5) * spread;
      const zSpread = (Math.random() - 0.5) * (spread * 0.4 + 0.3); // Disk thickness

      const x = Math.cos(theta) * radius + xSpread;
      const y = Math.sin(theta) * radius + ySpread;
      const z = zSpread;

      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;

      // Color mapping according to radius
      let col = colorCore.clone();
      const normR = Math.min(1.0, radius / 30.0);
      if (normR < 0.22) {
        col.lerp(colorGold, normR / 0.22);
      } else if (normR < 0.55) {
        const t = (normR - 0.22) / 0.33;
        col = colorGold.clone().lerp(colorMagenta, t);
      } else if (normR < 0.85) {
        const t = (normR - 0.55) / 0.30;
        col = colorMagenta.clone().lerp(colorCyan, t);
      } else {
        const t = (normR - 0.85) / 0.15;
        col = colorCyan.clone().lerp(colorBlue, t);
      }

      // Star sparkle variance
      if (Math.random() > 0.88) col.set('#ffffff');

      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;

      // Variable star sizes
      const baseSize = radius < 4 ? 0.75 : 0.45;
      starSizes[i] = baseSize + Math.random() * 0.65;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.9,
      map: starTexture ?? undefined,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const galaxyStars = new THREE.Points(starGeo, starMaterial);
    galaxyGroup.add(galaxyStars);

    // --- 3. Distant Background Deep Space Stars (800 Far Stars) ---
    const bgStarCount = 800;
    const bgGeo = new THREE.BufferGeometry();
    const bgPositions = new Float32Array(bgStarCount * 3);
    const bgColors = new Float32Array(bgStarCount * 3);

    for (let i = 0; i < bgStarCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 60.0 + Math.random() * 30.0;

      bgPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      bgPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      bgPositions[i * 3 + 2] = r * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      bgColors[i * 3] = brightness * (0.8 + Math.random() * 0.2);
      bgColors[i * 3 + 1] = brightness * (0.85 + Math.random() * 0.15);
      bgColors[i * 3 + 2] = brightness * 1.1;
    }
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    bgGeo.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

    const bgStarMat = new THREE.PointsMaterial({
      size: 0.55,
      map: starTexture ?? undefined,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const bgStarfield = new THREE.Points(bgGeo, bgStarMat);
    scene.add(bgStarfield);

    // --- 4. Inflow Accretion Spiral Particles (Matter pulled into Black Hole) ---
    const accretionCount = 900;
    const accretionGeo = new THREE.BufferGeometry();
    const accretionPositions = new Float32Array(accretionCount * 3);
    const accretionColors = new Float32Array(accretionCount * 3);
    const accretionData: Array<{ r: number; theta: number; z: number; speed: number; baseR: number }> = [];

    const accGold = new THREE.Color('#ffc83b');
    const accHot = new THREE.Color('#ffffff');
    const accAmber = new THREE.Color('#ff5500');

    for (let i = 0; i < accretionCount; i++) {
      const r = 1.8 + Math.random() * 16.0;
      const theta = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 1.5;
      const speed = 0.8 + Math.random() * 1.4;

      accretionData.push({ r, theta, z, speed, baseR: r });

      accretionPositions[i * 3] = Math.cos(theta) * r;
      accretionPositions[i * 3 + 1] = Math.sin(theta) * r;
      accretionPositions[i * 3 + 2] = z;

      const normR = r / 16.0;
      let col = accGold.clone().lerp(accAmber, normR);
      if (r < 4.0 || Math.random() > 0.85) col = accHot;

      accretionColors[i * 3] = col.r;
      accretionColors[i * 3 + 1] = col.g;
      accretionColors[i * 3 + 2] = col.b;
    }

    accretionGeo.setAttribute('position', new THREE.BufferAttribute(accretionPositions, 3));
    accretionGeo.setAttribute('color', new THREE.BufferAttribute(accretionColors, 3));
    accretionDataRef.current = accretionData;

    const accretionMat = new THREE.PointsMaterial({
      size: 0.65,
      map: starTexture ?? undefined,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const accretionPoints = new THREE.Points(accretionGeo, accretionMat);
    galaxyGroup.add(accretionPoints);
    accretionPointsRef.current = accretionPoints;

    // --- 5. Resize Handler ---
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- 6. Render Loop for Continuous Galaxy Rotation ---
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - prevTimeRef.current) / 1000, 0.1);
      prevTimeRef.current = now;

      // Base rotation rate + acceleration during timeline gravitational vortex
      // Timeline-driven speed multiplier:
      // 0.0s - 2.0s: speed = 1.0 (smooth majestic rotation)
      // 2.0s - 4.0s: speed ramps to 2.8x (gravitational acceleration)
      // 4.0s - 6.0s: speed smoothly stabilizes to 1.6x
      // 6.0s - 8.0s: speed settles to 1.1x
      let speedMult = 1.0;
      if (timeline >= 2.0 && timeline <= 4.0) {
        const pullProgress = (timeline - 2.0) / 2.0;
        speedMult = 1.0 + Math.sin(pullProgress * Math.PI) * 1.8;
      } else if (timeline > 4.0 && timeline <= 6.0) {
        const decay = (timeline - 4.0) / 2.0;
        speedMult = 1.6 - decay * 0.5;
      } else if (timeline > 6.0) {
        speedMult = 1.1;
      }

      // Continuous rotation increment
      const rotDelta = dt * 0.16 * speedMult;
      currentRotationRef.current += rotDelta;

      if (galaxyGroupRef.current) {
        // Rotate the galaxy along its spin axis (Z in local space)
        galaxyGroupRef.current.rotation.z = currentRotationRef.current;
      }

      // Also gently rotate distant background stars for deep parallax
      bgStarfield.rotation.y += dt * 0.015;
      bgStarfield.rotation.x += dt * 0.008;

      // Simulate inward accretion particles spiraling towards black hole
      if (accretionPointsRef.current && accretionDataRef.current.length > 0) {
        const geo = accretionPointsRef.current.geometry as THREE.BufferGeometry;
        const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
        const posArr = posAttr.array as Float32Array;
        const data = accretionDataRef.current;

        for (let i = 0; i < data.length; i++) {
          const item = data[i];

          // Keplerian orbital motion: inner particles orbit faster
          const orbSpeed = (3.2 / Math.max(item.r, 1.2)) * item.speed * speedMult;
          item.theta += dt * orbSpeed;

          // Spiral inward towards event horizon
          item.r -= dt * 0.45 * item.speed * (speedMult > 1.4 ? 1.9 : 1.0);

          // Once swallowed past inner threshold (r < 1.2), respawn out in the galaxy disk
          if (item.r < 1.2) {
            item.r = 14.0 + Math.random() * 4.0;
            item.theta = Math.random() * Math.PI * 2;
          }

          posArr[i * 3] = Math.cos(item.theta) * item.r;
          posArr[i * 3 + 1] = Math.sin(item.theta) * item.r;
          posArr[i * 3 + 2] = item.z;
        }
        posAttr.needsUpdate = true;
      }

      if (rendererRef.current) {
        rendererRef.current.render(scene, camera);
      }
    };

    animIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
      starGeo.dispose();
      starMaterial.dispose();
      bgGeo.dispose();
      bgStarMat.dispose();
      accretionGeo.dispose();
      accretionMat.dispose();
      if (starTexture) starTexture.dispose();
    };
  }, []);

  // Update dynamic effects based on timeline progression
  useEffect(() => {
    // Opacity fades in during first 0.8s
    if (containerRef.current) {
      const fadeIn = Math.min(1.0, timeline / 0.8);
      containerRef.current.style.opacity = fadeIn.toString();
    }
  }, [timeline]);

  // Core flare intensity during gravitational pull / arrival (t = 2.0s – 5.0s)
  let corePulse = 1.0;
  if (timeline >= 2.0 && timeline <= 5.0) {
    const p = (timeline - 2.0) / 3.0;
    corePulse = 1.0 + Math.sin(p * Math.PI) * 0.7;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden transition-opacity duration-700"
      style={{ opacity: 0 }}
    >
      {/* Radiant Galactic Core Nebula Glow */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none transition-all duration-500"
        style={{
          background: 'radial-gradient(circle at center, rgba(255, 240, 200, 0.28) 0%, rgba(255, 170, 50, 0.18) 25%, rgba(160, 40, 220, 0.12) 50%, rgba(0, 240, 255, 0.05) 70%, transparent 85%)',
          filter: 'blur(50px)',
          transform: `translate(-50%, -50%) scale(${corePulse})`,
        }}
      />
    </div>
  );
};

export default RotatingGalaxyBackground;
