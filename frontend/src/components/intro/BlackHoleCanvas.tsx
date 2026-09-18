import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BlackHoleCanvasProps {
  timeline: number; // 0.0 to 5.5s
  phase: 'space_begins' | 'blackhole_rotation' | 'pulling_in' | 'playx_reveal' | 'final_logo';
}

// =========================================================================
// GLSL Raymarching Shader: Gargantua General Relativity Black Hole
// Exact astrophysics rendering matching the user's reference image:
// - Prominent circular Event Horizon occupying ~40-45% screen height
// - Razor-sharp glowing white/gold Photon Ring at 1.5 Rs
// - Upper Lensed Halo (light from back of accretion disk bent over the top)
// - Lower Lensed Arc (light from back of accretion disk bent underneath)
// - Front Equatorial Accretion Disk passing across the foreground
// - Relativistic Doppler Beaming (approaching side boosted, receding dimmer)
// - Striated Keplerian orbital plasma turbulence
// - Centered, comfortable cinematic framing (never cropped)
// =========================================================================

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uSpaceFade;         // 0.0 -> 1.0 in Scene 1
  uniform float uDiskBrightness;    // Brightens during inward pull
  uniform float uRippleStrength;    // Spacetime gravitational ripple
  uniform float uRippleRadius;      // Expanding ripple ring
  uniform float uRecedeFactor;      // 0.0 -> 1.0 in Final Shot (moves black hole into background)

  varying vec2 vUv;

  // --- Striated Plasma Noise Functions ---
  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Multi-frequency directional streaks for striated Keplerian plasma
  float striatedPlasma(vec2 p) {
    float v = 0.0;
    // Anisotropic stretch along the orbital direction
    vec2 sp = vec2(p.x * 2.8, p.y * 36.0);
    v += 0.500 * noise(sp);
    v += 0.250 * noise(sp * 2.04 + vec2(1.2, 3.4));
    v += 0.125 * noise(sp * 4.11 + vec2(4.3, 1.7));
    v += 0.065 * noise(sp * 8.23);
    return v;
  }

  // Background deep space starfield with realistic lensing distortion
  vec3 getStarfield(vec3 dir) {
    vec2 sp = vec2(atan(dir.z, dir.x), asin(clamp(dir.y, -1.0, 1.0)));
    float stars = pow(hash(floor(sp * 160.0)), 36.0) * 2.2;
    float fineStars = pow(hash(floor(sp * 380.0)), 48.0) * 1.4;
    
    vec3 col = vec3(stars + fineStars);
    // Subtle cosmic temperature variation (blue-white to warm amber)
    col *= vec3(0.9, 0.95, 1.15 + 0.1 * sin(dir.x * 12.0));

    // Distant faint cosmic nebula dust
    float neb = noise(sp * 4.0) * 0.08;
    col += vec3(0.18, 0.12, 0.28) * neb;

    return col;
  }

  void main() {
    // Screen coordinates normalized by height: y in [-0.5, 0.5]
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;

    // Camera setup: Centered, front-facing cinematic angle, elevated ~12 degrees
    // At this distance, the Rs = 0.50 event horizon occupies exactly ~42-46% of screen height
    float camDist = mix(4.0, 5.6, uRecedeFactor);
    float camElevation = mix(0.48, 0.65, uRecedeFactor);
    vec3 ro = vec3(0.0, camElevation, camDist);
    vec3 ta = vec3(0.0, 0.0, 0.0);

    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
    vec3 vv = cross(uu, ww);

    // Camera ray direction (FOV factor 1.85 keeps entire black hole and halo in comfortable view)
    vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.85 * ww);

    // Spacetime Gravitational Ripple Distortion (Scene 3 -> 4)
    if (uRippleStrength > 0.001) {
      float rDist = length(uv);
      float wave = sin((rDist - uRippleRadius) * 40.0) * 
                   exp(-abs(rDist - uRippleRadius) * 12.0) * 
                   uRippleStrength * 0.07;
      vec2 rDir = normalize(uv + 0.0001);
      rd = normalize(rd + (rDir.x * uu + rDir.y * vv) * wave);
    }

    // =========================================================
    // Schwarzschild Metric Black Hole Constants
    // =========================================================
    float Rs = 0.50;               // Schwarzschild Event Horizon Radius
    float R_isco = Rs * 1.55;      // Innermost Stable Circular Orbit (~0.77)
    float R_out = Rs * 5.4;        // Outer Accretion Disk Edge (~2.70)
    float stepSize = 0.048;        // Geodesic integration step
    vec3 p = ro;

    vec3 diskAccum = vec3(0.0);
    float diskAlpha = 0.0;
    bool hitEventHorizon = false;
    float closestDistToCenter = 100.0;

    // Curved Geodesic Raymarcher (Simulating curved spacetime light paths)
    for (int i = 0; i < 78; i++) {
      float r = length(p);
      closestDistToCenter = min(closestDistToCenter, r);

      // Event Horizon Condition: Ray has crossed into the shadow
      if (r < Rs) {
        hitEventHorizon = true;
        break;
      }

      // Gravitational acceleration bending the photon path towards the singularity
      // Einstein light bending formula in Schwarzschild geometry
      vec3 g = -normalize(p) * (1.52 * Rs) / (r * r + 0.018);
      rd = normalize(rd + g * stepSize);
      vec3 nextP = p + rd * stepSize;

      // Check intersection with the accretion disk plane (y = 0)
      // Rays going above the black hole bend downward and cross y = 0 BEHIND it (Upper Lensed Halo)
      // Rays going below the black hole bend upward and cross y = 0 BEHIND it (Lower Lensed Arc)
      // Rays passing across the front cross y = 0 IN FRONT of the horizon (Equatorial Front Band)
      if ((p.y > 0.0 && nextP.y <= 0.0) || (p.y < 0.0 && nextP.y >= 0.0)) {
        float t = abs(p.y) / (abs(p.y - nextP.y) + 0.00001);
        vec3 hitPos = mix(p, nextP, t);
        float diskR = length(hitPos.xz);

        if (diskR >= R_isco && diskR <= R_out) {
          // Keplerian differential orbital velocity: v ~ r^(-1.5)
          float orbitalSpeed = 2.8 * pow(R_isco / diskR, 1.5);
          float angle = atan(hitPos.z, hitPos.x) - uTime * orbitalSpeed;

          // Normalized radial coordinate [0.0, 1.0]
          float normR = (diskR - R_isco) / (R_out - R_isco);

          // Fine striated fibrous plasma texture
          float plasma = striatedPlasma(vec2(angle, normR));

          // Radial Luminosity Profile:
          // Maximum brilliance near ISCO, fading gently outward
          float radialGlow = smoothstep(0.0, 0.08, normR) * pow(1.0 - normR, 0.9);

          // Relativistic Doppler Beaming / Boosting:
          // Left side orbiting toward the camera is intensely blueshifted and brightened
          // Right side orbiting away is dimmed and redshifted
          float dopplerFactor = 1.0 - clamp(hitPos.x / diskR, -0.92, 0.92) * 0.65;
          float beaming = pow(1.0 / max(dopplerFactor, 0.22), 3.4);

          // =========================================================
          // Gargantua Color Palette (Exact Match to Reference Image):
          // Core: Blazing white-hot incandescent light (#ffffff, #fff4e0)
          // Inner Disk: Intense golden-yellow fire (#ffc83b, #ff9e1b)
          // Mid Disk: Rich fiery copper-amber (#e65c00, #c43b08)
          // Outer Edge: Deep smoldering dark amber-brown (#5c1800)
          // Relativistic Boost: Subtle cyan-white spectral shift on approaching edge
          // =========================================================
          vec3 coreHot = vec3(1.0, 0.98, 0.92);    // Blazing white
          vec3 goldFire = vec3(1.0, 0.72, 0.22);   // Golden yellow
          vec3 amberFire = vec3(0.92, 0.38, 0.08); // Fiery amber
          vec3 darkEmber = vec3(0.42, 0.12, 0.03); // Deep red-brown

          vec3 diskColor = mix(coreHot, goldFire, smoothstep(0.0, 0.25, normR));
          diskColor = mix(diskColor, amberFire, smoothstep(0.25, 0.65, normR));
          diskColor = mix(diskColor, darkEmber, smoothstep(0.65, 1.0, normR));

          // Subtle relativistic cyan-blue shift on the extreme left approaching edge
          if (hitPos.x < 0.0) {
            float blueShift = pow(clamp(-hitPos.x / diskR, 0.0, 1.0), 2.5) * 0.35;
            diskColor = mix(diskColor, vec3(0.6, 0.9, 1.0), blueShift);
          }

          // Composite plasma emission
          float intensity = plasma * radialGlow * beaming * 1.55 * uDiskBrightness;

          // Razor-sharp Photon Ring right at ISCO / Photon Sphere
          float photonRing = exp(-pow(abs(diskR - R_isco * 1.08) / (Rs * 0.025), 2.0)) * 4.2 * uDiskBrightness;
          diskColor += vec3(1.0, 0.95, 0.85) * photonRing;

          // Volumetric alpha accumulation
          float sampleAlpha = clamp(intensity * 0.75, 0.0, 0.98);
          vec3 sampleColor = diskColor * intensity;

          diskAccum += sampleColor * (1.0 - diskAlpha);
          diskAlpha += sampleAlpha * (1.0 - diskAlpha);

          if (diskAlpha > 0.98) break;
        }
      }

      p = nextP;
    }

    // Final color accumulation
    vec3 finalColor = vec3(0.0);

    if (!hitEventHorizon) {
      // Ray escaped to deep space: sample gravitationally lensed stars
      vec3 starColor = getStarfield(rd);
      finalColor = starColor * (1.0 - diskAlpha) + diskAccum;
    } else {
      // Ray captured by the Event Horizon: pure black void
      // Only foreground disk light in front of the horizon is visible
      finalColor = diskAccum;
    }

    // Primary Einstein Photon Sphere Ring (Ultra-sharp white/golden halo encircling the shadow)
    float screenRadius = length(uv);
    float photonSphereScreenR = 0.235 * (4.0 / camDist);
    float ringGlow = exp(-pow(abs(screenRadius - photonSphereScreenR) / 0.008, 2.0)) * 1.8 * uDiskBrightness;
    // Don't render inside the event horizon shadow
    if (screenRadius > photonSphereScreenR * 0.95) {
      finalColor += vec3(1.0, 0.96, 0.90) * ringGlow;
    }

    // Scene 1: Space Begins Fade In
    finalColor *= uSpaceFade;

    // Final Shot: When moving to background, black hole dims slightly to let PLAYX be the hero
    if (uRecedeFactor > 0.01) {
      finalColor *= mix(1.0, 0.60, uRecedeFactor);
    }

    // Gentle cinematic vignette
    float vignette = 1.0 - smoothstep(0.65, 1.4, length(uv));
    finalColor *= vignette;

    // High Dynamic Range (HDR) Filmic Tone Mapping (prevents color burn while keeping fire hot)
    finalColor = (finalColor * (2.6 * finalColor + 0.04)) / (finalColor * (2.4 * finalColor + 0.62) + 0.12);

    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
  }
`;

export const BlackHoleCanvas: React.FC<BlackHoleCanvasProps> = ({ timeline, phase }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const uniformsRef = useRef<Record<string, { value: any }> | null>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particleDataRef = useRef<Array<{ r: number; theta: number; y: number; speed: number }>>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: false,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const uniforms = {
      uResolution: { value: new THREE.Vector2(width, height) },
      uTime: { value: 0 },
      uSpaceFade: { value: 0 },
      uDiskBrightness: { value: 1.0 },
      uRippleStrength: { value: 0.0 },
      uRippleRadius: { value: 0.0 },
      uRecedeFactor: { value: 0.0 },
    };
    uniformsRef.current = uniforms;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    // 3D Inward Spiraling Glowing Particle Vortex
    // 1,500 particles swirling from outer space toward the event horizon
    const particleCount = 1400;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleData: Array<{ r: number; theta: number; y: number; speed: number }> = [];

    const goldColor = new THREE.Color('#ffc83b');
    const amberColor = new THREE.Color('#ff7b1a');
    const whiteColor = new THREE.Color('#ffffff');
    const cyanColor = new THREE.Color('#00f0ff');

    for (let i = 0; i < particleCount; i++) {
      const r = 0.45 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 0.28 * r;
      const speed = 0.7 + Math.random() * 1.3;

      particleData.push({ r, theta, y, speed });

      particlePositions[i * 3] = Math.cos(theta) * r;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = Math.sin(theta) * r;

      const normR = r / 3.0;
      let col = goldColor.clone().lerp(amberColor, normR);
      if (Math.random() > 0.8) col = whiteColor;
      else if (Math.random() > 0.88) col = cyanColor;

      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    particleDataRef.current = particleData;

    const particleMat = new THREE.PointsMaterial({
      size: 3.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    particles.position.z = 0.1;
    scene.add(particles);
    particlesRef.current = particles;

    const handleResize = () => {
      if (!container || !rendererRef.current || !uniformsRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      rendererRef.current.setSize(w, h);
      uniformsRef.current.uResolution.value.set(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
      material.dispose();
      quad.geometry.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  // Update simulation driven by intro timeline
  useEffect(() => {
    if (!uniformsRef.current || !rendererRef.current) return;

    const t = timeline;
    const u = uniformsRef.current;

    u.uTime.value = t;

    // Scene 1: Full Black Hole Appears (0.0s – 1.4s)
    // Starts black, then deep space and full black hole gracefully emerge
    if (t <= 1.4) {
      const spaceProgress = Math.min(1.0, Math.max(0.0, (t - 0.25) / 1.1));
      u.uSpaceFade.value = Math.pow(spaceProgress, 1.6);
      u.uDiskBrightness.value = 0.8 + spaceProgress * 0.2;
      u.uRippleStrength.value = 0.0;
      u.uRecedeFactor.value = 0.0;
    }
    // Scene 2: Realistic Rotation (1.4s – 2.8s)
    // Full black hole rotating in all its majesty; event horizon fully visible
    else if (t <= 2.8) {
      u.uSpaceFade.value = 1.0;
      u.uDiskBrightness.value = 1.05;
      u.uRippleStrength.value = 0.0;
      u.uRecedeFactor.value = 0.0;
    }
    // Scene 3: Black Hole Pulls Everything In (2.8s – 3.8s)
    // Rotation accelerates, particles spiral inward, disk flares, energy concentrates
    else if (t <= 3.8) {
      u.uSpaceFade.value = 1.0;
      const pullProgress = (t - 2.8) / 1.0;

      // Disk flares with concentrated power
      const flare = Math.sin(pullProgress * Math.PI);
      u.uDiskBrightness.value = 1.1 + flare * 1.35;

      // Spacetime ripple forms towards end of pull
      if (pullProgress >= 0.7) {
        const rippleProgress = (pullProgress - 0.7) / 0.3;
        u.uRippleRadius.value = rippleProgress * 0.8;
        u.uRippleStrength.value = Math.sin(rippleProgress * Math.PI) * 1.5;
      } else {
        u.uRippleStrength.value = 0.0;
      }

      u.uRecedeFactor.value = 0.0;
    }
    // Scene 4: PLAYX Reveal (3.8s – 4.7s)
    // Light burst from center, PLAYX emerges, black hole gently recedes
    else if (t <= 4.7) {
      u.uSpaceFade.value = 1.0;
      const revealProgress = (t - 3.8) / 0.9;
      u.uDiskBrightness.value = 1.8 - revealProgress * 0.8;

      // Ripples expand outward as PLAYX emerges
      if (revealProgress <= 0.6) {
        const rippleProg = revealProgress / 0.6;
        u.uRippleRadius.value = 0.6 + rippleProg * 1.2;
        u.uRippleStrength.value = (1.0 - rippleProg) * 1.2;
      } else {
        u.uRippleStrength.value = 0.0;
      }

      // Black hole gently recedes into the background
      u.uRecedeFactor.value = THREE.MathUtils.smoothstep(revealProgress, 0.1, 1.0) * 0.6;
    }
    // Final Shot (4.7s – 5.5s)
    // PLAYX locked in center, black hole stable in background
    else {
      u.uSpaceFade.value = 1.0;
      u.uDiskBrightness.value = 1.0;
      u.uRippleStrength.value = 0.0;
      const finalProgress = Math.min(1.0, (t - 4.7) / 0.7);
      u.uRecedeFactor.value = 0.6 + finalProgress * 0.4;
    }

    // Particle Inflow Simulation
    if (particlesRef.current && particleDataRef.current.length > 0) {
      const geo = particlesRef.current.geometry as THREE.BufferGeometry;
      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const data = particleDataRef.current;
      const pMat = particlesRef.current.material as THREE.PointsMaterial;

      // Particle visibility
      if (t < 0.3) {
        pMat.opacity = 0.0;
      } else if (t < 1.4) {
        pMat.opacity = ((t - 0.3) / 1.1) * 0.75;
      } else if (t < 4.2) {
        pMat.opacity = 0.95;
      } else {
        // Lingering gentle particles in Final Shot
        pMat.opacity = 0.45;
      }

      // Strong inward pull during Scene 3 (2.8s – 3.8s)
      const isPulling = t >= 2.8 && t <= 3.9;
      const pullSpeed = isPulling ? 3.8 : 1.0;

      for (let i = 0; i < data.length; i++) {
        const item = data[i];

        // Keplerian angular motion
        item.theta += 0.018 * item.speed * pullSpeed * (1.2 / Math.max(item.r, 0.3));

        // Spiral inward toward the event horizon
        item.r -= 0.003 * item.speed * pullSpeed;

        // When a particle plunges past event horizon (r < 0.42), respawn outside
        if (item.r < 0.42) {
          item.r = 2.4 + Math.random() * 0.6;
          item.theta = Math.random() * Math.PI * 2;
        }

        posArray[i * 3] = Math.cos(item.theta) * item.r;
        posArray[i * 3 + 1] = item.y * (item.r / 2.0);
        posArray[i * 3 + 2] = Math.sin(item.theta) * item.r;
      }
      posAttr.needsUpdate = true;
    }

    if (rendererRef.current) {
      const scene = particlesRef.current?.parent as THREE.Scene;
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 1;
      if (scene) {
        rendererRef.current.render(scene, camera);
      }
    }
  }, [timeline]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
    />
  );
};

export default BlackHoleCanvas;
