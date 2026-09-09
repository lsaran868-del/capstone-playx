import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Mail,
  Lock,
  User as UserIcon,
  Music,
  X,
  Sun,
  Moon,
  Zap,
  Sparkles,
  Disc3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

interface MusicDirectorSlide {
  id: string;
  src: string;
  name: string;
  badge: string;
  role: string;
  desc: string;
  accentColor: string;
  focalPoint: string;
}

// Curated music director showcase featuring all user-provided imagery
const MUSIC_DIRECTORS: MusicDirectorSlide[] = [
  {
    id: 'anirudh-live',
    src: '/images/music_directors/anirudh.png',
    name: 'Anirudh Ravichander',
    badge: 'Rockstar Composer',
    role: 'Music Director & Producer',
    desc: 'Powering high-octane youth anthems, chart-toppers & infectious viral rhythms.',
    accentColor: '#ec4899',
    focalPoint: 'object-[center_20%]'
  },
  {
    id: 'anirudh-swagger',
    src: '/images/music_directors/anirudh_swagger.jpg',
    name: 'Anirudh (The Hitmaker)',
    badge: 'Chart-Topping Beats',
    role: 'Sensational Music Icon',
    desc: 'Defining the soundscape of contemporary cinema with unmatched style and swagger.',
    accentColor: '#f43f5e',
    focalPoint: 'object-[center_20%]'
  },
  {
    id: 'arr-art',
    src: '/images/music_directors/arr_art.jpg',
    name: 'A.R. Rahman',
    badge: 'The Mozart of Madras',
    role: 'Academy & Grammy Winner',
    desc: 'Transcending global frontiers with timeless symphonies and spiritual depth.',
    accentColor: '#8b5cf6',
    focalPoint: 'object-center'
  },
  {
    id: 'arr-live',
    src: '/images/music_directors/arr_live.jpg',
    name: 'A.R. Rahman (Live)',
    badge: 'Electrifying Arena Sound',
    role: 'Synthesizer & Stage Maestro',
    desc: 'Feel the concert-grade bass dynamics, stadium synthesizers, and live energy.',
    accentColor: '#00f0ff',
    focalPoint: 'object-center'
  },
  {
    id: 'dsp',
    src: '/images/music_directors/dsp.jpg',
    name: 'Devi Sri Prasad (DSP)',
    badge: 'Rockstar DSP',
    role: 'Mass Beat & Energetic Maestro',
    desc: 'Creator of iconic high-energy dance tracks, mass anthems & chartbuster rhythms.',
    accentColor: '#eab308',
    focalPoint: 'object-[center_20%]'
  },
  {
    id: 'thaman',
    src: '/images/music_directors/thaman.jpg',
    name: 'S. Thaman',
    badge: 'Electronic & Stadium Powerhouse',
    role: 'Blockbuster Film Composer',
    desc: 'Electrifying stadium beats, thumping percussion, and unforgettable melodies.',
    accentColor: '#ef4444',
    focalPoint: 'object-[center_15%]'
  },
  {
    id: 'gv-prakash',
    src: '/images/music_directors/gv_prakash.jpg',
    name: 'G.V. Prakash Kumar',
    badge: 'Melodic Maestro',
    role: 'National Award Winner',
    desc: 'Evoking deep acoustic resonance through soulful film scores and folk elegance.',
    accentColor: '#f59e0b',
    focalPoint: 'object-[center_25%]'
  },
  {
    id: 'hariharan',
    src: '/images/music_directors/hariharan.jpg',
    name: 'Hariharan',
    badge: 'Soul-Stirring Legend',
    role: 'Padma Shri Maestro & Vocalist',
    desc: 'Ghazals, classic cinematic melodies, and unforgettable acoustic vocal mastery.',
    accentColor: '#a855f7',
    focalPoint: 'object-[center_20%]'
  },
  {
    id: 'ilaiyaraaja',
    src: '/images/music_directors/ilaiyaraaja.jpg',
    name: 'Ilaiyaraaja',
    badge: 'Isaignani',
    role: 'Maestro of Symphonic Harmony',
    desc: 'Living legend with 7,000+ timeless cinematic orchestrations and milestones.',
    accentColor: '#10b981',
    focalPoint: 'object-[center_20%]'
  }
];

const isValidEmail = (val: string) => {
  const clean = val.trim();
  return clean.includes('@') && clean.indexOf('@') > 0 && clean.indexOf('@') < clean.length - 1;
};

const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNotice, setForgotNotice] = useState('');

  // Music Director Slideshow State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Preload all director images on component mount for instant, zero-flicker transitions
  useEffect(() => {
    MUSIC_DIRECTORS.forEach((director) => {
      const img = new Image();
      img.src = director.src;
    });
  }, []);

  // Continuous, uninterrupted 1.5s automatic slideshow loop
  // Continues running continuously regardless of mode toggles (login vs register)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % MUSIC_DIRECTORS.length);
    }, 1600); // 1.6s interval for optimal pacing (~1.5s display + smooth crossfade)

    return () => clearInterval(timer);
  }, []);

  const { login, register } = useAuth();
  const { theme, toggleTheme, isDark, isLight, isCyber, themeName } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync mode with route if accessed via /login or /register
  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('register');
    } else if (location.pathname === '/login') {
      setMode('login');
    }
  }, [location.pathname]);

  // Seamlessly switch between Login and Register WITHOUT restarting or stopping the slideshow
  const switchMode = (newMode: 'login' | 'register') => {
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
    setMode(newMode);
    if (newMode === 'login') {
      navigate('/login', { replace: true });
    } else {
      navigate('/register', { replace: true });
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both email and password.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address (e.g. user@example.com).');
      return;
    }

    setLoading(true);
    try {
      await login(cleanEmail, cleanPassword);
      setSuccessMsg('Welcome back to PlayX! Preparing your music universe...');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1200);
    } catch (err: any) {
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Unable to connect to PlayX server. Please ensure the backend is running.');
      } else {
        setError('Authentication failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError('Email and password are required.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address (e.g. user@example.com).');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(cleanName || cleanEmail.split('@')[0], cleanEmail, password, 'user');
      setSuccessMsg('Account created successfully! Welcome to PlayX.');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1200);
    } catch (err: any) {
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Unable to reach PlayX server. Please check your connection.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !isValidEmail(forgotEmail.trim())) {
      setForgotNotice('Please provide a valid registered email address.');
      return;
    }
    setForgotNotice(`Password reset instructions have been sent to ${forgotEmail.trim()}.`);
    setTimeout(() => {
      setForgotModalOpen(false);
      setForgotNotice('');
    }, 2800);
  };

  const activeDirector = MUSIC_DIRECTORS[currentSlide];

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-3 sm:p-6 lg:p-8 select-none font-sans relative overflow-x-hidden transition-colors duration-500 ${
        isLight
          ? 'bg-[#f6f4fa] text-[#160c28]'
          : isCyber
          ? 'bg-[#030712] text-white'
          : 'bg-[#0a0514] text-white'
      }`}
    >
      {/* Floating Theme Switcher */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className={`px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 text-xs font-semibold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
            isLight
              ? 'bg-white/90 border-purple-200 text-[#160c28] shadow-purple-900/10'
              : isCyber
              ? 'bg-[#061530]/85 border-cyan-400/50 text-cyan-300 shadow-cyan-500/25'
              : 'bg-[#181126]/85 border-pink-500/30 text-purple-200 shadow-black/40'
          }`}
          title={`Active Theme: ${themeName}. Click to toggle theme.`}
        >
          {isLight ? (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          ) : isCyber ? (
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-pink-400" />
          )}
          <span>{themeName}</span>
        </button>
      </div>

      {/* Atmospheric Ambient Glows */}
      {isLight ? (
        <>
          <div className="fixed -top-24 -left-24 w-[500px] h-[500px] rounded-full bg-purple-300/30 blur-[150px] pointer-events-none" />
          <div className="fixed -bottom-24 -right-24 w-[500px] h-[500px] rounded-full bg-pink-300/25 blur-[150px] pointer-events-none" />
        </>
      ) : isCyber ? (
        <>
          <div className="fixed -top-28 -left-28 w-[550px] h-[550px] rounded-full bg-cyan-500/20 blur-[160px] pointer-events-none" />
          <div className="fixed -bottom-28 -right-28 w-[550px] h-[550px] rounded-full bg-pink-600/20 blur-[160px] pointer-events-none" />
          <div className="fixed top-1/2 left-1/3 w-[350px] h-[350px] rounded-full bg-blue-600/15 blur-[140px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="fixed -top-28 -left-28 w-[550px] h-[550px] rounded-full bg-pink-600/15 blur-[160px] pointer-events-none" />
          <div className="fixed -bottom-28 -right-28 w-[550px] h-[550px] rounded-full bg-purple-600/20 blur-[160px] pointer-events-none" />
          <div className="fixed top-1/3 right-1/4 w-[350px] h-[350px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />
        </>
      )}

      {/* Subtle Transparent PLAYX Background Watermark */}
      <div className="playx-bg-watermark">
        <div className="playx-bg-watermark-text opacity-60">
          PLAY<span className="playx-bg-watermark-accent">X</span>
        </div>
      </div>

      {/* Master Card Container */}
      <div
        className={`w-full max-w-[1060px] rounded-[32px] backdrop-blur-2xl overflow-hidden flex flex-col md:flex-row relative z-10 shadow-2xl transition-all duration-300 border ${
          isLight
            ? 'bg-white/95 border-purple-200/80 shadow-[0_25px_70px_rgba(147,51,234,0.12)]'
            : isCyber
            ? 'bg-[#050b18]/95 border-cyan-500/30 shadow-[0_25px_80px_rgba(0,240,255,0.18)]'
            : 'bg-[#130b20]/95 border-purple-500/20 shadow-[0_30px_90px_rgba(0,0,0,0.9)]'
        }`}
      >
        {/* ============================================================ */}
        {/* SIDE IMAGE SLIDESHOW COLUMN (Desktop & Mobile Adaptive)      */}
        {/* ============================================================ */}
        <div className="md:w-[48%] p-3 sm:p-4 flex flex-col">
          <div
            className={`relative w-full h-[270px] sm:h-[330px] md:h-full md:min-h-[640px] rounded-[24px] overflow-hidden shadow-2xl group ${
              isCyber ? 'bg-[#020712]' : 'bg-[#0a0514]'
            }`}
          >
            {/* Layer 1: All 9 Pre-rendered Music Director Photos (Zero-Flicker Crossfade) */}
            {MUSIC_DIRECTORS.map((director, index) => {
              const isActive = index === currentSlide;
              return (
                <div
                  key={director.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                  }`}
                  aria-hidden={!isActive}
                >
                  <img
                    src={director.src}
                    alt={director.name}
                    className={`w-full h-full object-cover ${director.focalPoint} transform transition-transform duration-1000 ease-out ${
                      isActive ? 'scale-100' : 'scale-105'
                    }`}
                  />
                  {/* Subtle artistic tint */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none mix-blend-color transition-colors duration-700"
                    style={{ backgroundColor: director.accentColor }}
                  />
                </div>
              );
            })}

            {/* Layer 2: Deep Cinematic Vignette & Gradient Overlays */}
            {/* Bottom Dark Gradient for crisp text readability */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#080310] via-[#080310]/55 to-transparent z-20" />
            
            {/* Top Dark Gradient for logo & controls readability */}
            <div className="absolute inset-x-0 top-0 h-28 pointer-events-none bg-gradient-to-b from-[#080310]/80 via-[#080310]/30 to-transparent z-20" />

            {/* Desktop Right Edge Soft Blend */}
            <div
              className={`hidden md:block absolute inset-y-0 right-0 w-20 pointer-events-none z-20 ${
                isLight
                  ? 'bg-gradient-to-r from-transparent to-white/40'
                  : isCyber
                  ? 'bg-gradient-to-r from-transparent to-[#050b18]/80'
                  : 'bg-gradient-to-r from-transparent to-[#130b20]/80'
              }`}
            />

            {/* Top Bar: PlayX Brand & Live Status */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30">
              {/* PlayX Brand Logo */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/20 transition-transform duration-300 hover:scale-105 ${
                    isCyber
                      ? 'bg-gradient-to-tr from-[#00f0ff] via-[#0077b6] to-[#ec4899] shadow-cyan-900/60'
                      : 'bg-gradient-to-tr from-[#e02b88] via-[#a855f7] to-[#7c3aed] shadow-pink-900/60'
                  }`}
                >
                  <Disc3 className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <span className="font-display font-black text-white text-xl tracking-wider drop-shadow-md">
                  PLAY<span className={isCyber ? 'text-[#00f0ff]' : 'text-[#ec4899]'}>X</span>
                </span>
              </div>

              {/* Live Audio Equalizer Indicator Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white/90 shadow-md">
                <div className="flex items-end gap-[3px] h-3.5">
                  <span className="equalizer-bar" style={{ height: '8px' }} />
                  <span className="equalizer-bar" style={{ height: '14px' }} />
                  <span className="equalizer-bar" style={{ height: '6px' }} />
                </div>
                <span className="tracking-wide">Hi-Fi</span>
              </div>
            </div>

            {/* Bottom Content: Music Director Info & Dynamic Captions */}
            <div className="absolute bottom-5 left-5 right-5 z-30 space-y-2 text-left">
              {/* Animated Category / Title Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md text-[11px] font-bold tracking-wide uppercase shadow-lg border ${
                    isCyber
                      ? 'bg-cyan-950/70 border-cyan-400/40 text-cyan-300'
                      : 'bg-pink-950/70 border-pink-500/40 text-pink-300'
                  }`}
                >
                  <Music className="w-3 h-3" />
                  <span>{activeDirector.badge}</span>
                </div>
                <div className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-white/75">
                  <span>{activeDirector.role}</span>
                </div>
              </div>

              {/* Music Director Name */}
              <h3 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] transition-all duration-300">
                {activeDirector.name}
              </h3>

              {/* Music Director Description / Quote */}
              <p className="text-xs sm:text-sm text-purple-100/90 font-normal leading-relaxed line-clamp-2 drop-shadow-sm max-w-[420px]">
                {activeDirector.desc}
              </p>

              {/* Interactive Slideshow Progress Tracker Bars */}
              <div className="pt-2 flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {MUSIC_DIRECTORS.map((item, idx) => {
                  const isCurrent = idx === currentSlide;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      title={`View ${item.name}`}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        isCurrent
                          ? isCyber
                            ? 'w-5 sm:w-6 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(0,240,255,0.7)]'
                            : 'w-5 sm:w-6 bg-gradient-to-r from-[#e02b88] to-[#9d4edd] shadow-[0_0_10px_rgba(224,43,136,0.7)]'
                          : 'w-1.5 sm:w-2 bg-white/30 hover:bg-white/60'
                      }`}
                      aria-label={`Slide ${idx + 1}: ${item.name}`}
                    />
                  );
                })}
                <span className="text-[10px] text-white/50 font-mono ml-1.5">
                  {currentSlide + 1} / {MUSIC_DIRECTORS.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* AUTHENTICATION FORM COLUMN                                   */}
        {/* ============================================================ */}
        <div
          className={`md:w-[52%] p-6 sm:p-10 md:p-12 flex flex-col justify-center transition-colors duration-300 ${
            isLight
              ? 'bg-white text-[#160c28]'
              : isCyber
              ? 'bg-[#050b18] text-white'
              : 'bg-[#130b20] text-white'
          }`}
        >
          <div className="max-w-[400px] w-full mx-auto space-y-6">
            {/* Mobile Header Branding */}
            <div className="flex md:hidden items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-md ${
                    isCyber
                      ? 'bg-gradient-to-tr from-[#00f0ff] to-[#ec4899]'
                      : 'bg-gradient-to-tr from-[#e02b88] to-[#7c3aed]'
                  }`}
                >
                  <Disc3 className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-black text-lg tracking-wider">
                  PLAY<span className={isCyber ? 'text-[#00f0ff]' : 'text-[#ec4899]'}>X</span>
                </span>
              </div>
              <span className="text-xs text-purple-300/70 font-medium">Studio Audio</span>
            </div>

            {/* Segmented Mode Switch Tabs */}
            <div
              className={`p-1 rounded-2xl flex items-center border transition-all ${
                isLight
                  ? 'bg-purple-100/60 border-purple-200/80'
                  : isCyber
                  ? 'bg-[#030914] border-cyan-500/25'
                  : 'bg-[#0c0615] border-purple-500/20'
              }`}
            >
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  mode === 'login'
                    ? isLight
                      ? 'bg-white text-[#7c3aed] shadow-md shadow-purple-900/10'
                      : isCyber
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-gradient-to-r from-[#e02b88] to-[#9d4edd] text-white shadow-[0_0_16px_rgba(224,43,136,0.35)]'
                    : isLight
                    ? 'text-[#6d5e82] hover:text-[#160c28]'
                    : 'text-purple-300/60 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  mode === 'register'
                    ? isLight
                      ? 'bg-white text-[#7c3aed] shadow-md shadow-purple-900/10'
                      : isCyber
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-gradient-to-r from-[#e02b88] to-[#9d4edd] text-white shadow-[0_0_16px_rgba(224,43,136,0.35)]'
                    : isLight
                    ? 'text-[#6d5e82] hover:text-[#160c28]'
                    : 'text-purple-300/60 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Heading & Subtitle */}
            <div className="space-y-1 text-left">
              <h2
                className={`font-display text-3xl sm:text-4xl font-extrabold tracking-tight ${
                  isLight ? 'text-[#160c28]' : 'text-white'
                }`}
              >
                {mode === 'register' ? 'Join PlayX' : 'Welcome Back'}
              </h2>
              <p
                className={`text-xs sm:text-sm font-normal ${
                  isLight ? 'text-[#6d5e82]' : isCyber ? 'text-[#82a0c4]' : 'text-[#9f92b4]'
                }`}
              >
                {mode === 'register'
                  ? 'Start streaming unlimited lossless music and curate your sound universe.'
                  : 'Enter your credentials to resume your personalized music session.'}
              </p>
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-start gap-2.5 animate-fadeIn text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <span className="flex-1 leading-snug">{error}</span>
              </div>
            )}

            {/* Success Notification Banner */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-start gap-2.5 animate-fadeIn text-left">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                <span className="flex-1 leading-snug">{successMsg}</span>
              </div>
            )}

            {/* Interactive Form */}
            <form
              onSubmit={mode === 'register' ? handleRegisterSubmit : handleLoginSubmit}
              className="space-y-4 text-left"
              noValidate
            >
              {/* Register Mode: Name Input */}
              {mode === 'register' && (
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                      isLight ? 'text-[#6d5e82]' : isCyber ? 'text-[#82a0c4]' : 'text-[#9f92b4]'
                    }`}
                  >
                    Your Name
                  </label>
                  <div className="relative">
                    <UserIcon
                      className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                        isLight ? 'text-[#8c7a9e]' : isCyber ? 'text-[#3b668f]' : 'text-[#7d7798]'
                      }`}
                    />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Saran Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full rounded-xl pl-10 pr-3.5 py-3 text-sm transition-all font-sans focus:outline-none ${
                        isLight
                          ? 'bg-[#f5f1fb] border border-purple-200/90 text-[#160c28] placeholder-[#9a8bb0] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20'
                          : isCyber
                          ? 'bg-[#030814] border border-cyan-500/35 text-white placeholder-[#426084] focus:border-[#00f0ff] focus:ring-2 focus:ring-[#00f0ff]/30'
                          : 'bg-[#1b122c] border border-purple-500/25 text-white placeholder-[#686282] focus:border-[#e02b88] focus:ring-2 focus:ring-[#e02b88]/30'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-[#6d5e82]' : isCyber ? 'text-[#82a0c4]' : 'text-[#9f92b4]'
                  }`}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                      isLight ? 'text-[#8c7a9e]' : isCyber ? 'text-[#3b668f]' : 'text-[#7d7798]'
                    }`}
                  />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full rounded-xl pl-10 pr-3.5 py-3 text-sm transition-all font-sans focus:outline-none ${
                      isLight
                        ? 'bg-[#f5f1fb] border border-purple-200/90 text-[#160c28] placeholder-[#9a8bb0] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20'
                        : isCyber
                        ? 'bg-[#030814] border border-cyan-500/35 text-white placeholder-[#426084] focus:border-[#00f0ff] focus:ring-2 focus:ring-[#00f0ff]/30'
                        : 'bg-[#1b122c] border border-purple-500/25 text-white placeholder-[#686282] focus:border-[#e02b88] focus:ring-2 focus:ring-[#e02b88]/30'
                    }`}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-[#6d5e82]' : isCyber ? 'text-[#82a0c4]' : 'text-[#9f92b4]'
                  }`}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                      isLight ? 'text-[#8c7a9e]' : isCyber ? 'text-[#3b668f]' : 'text-[#7d7798]'
                    }`}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full rounded-xl pl-10 pr-11 py-3 text-sm transition-all font-sans focus:outline-none ${
                      isLight
                        ? 'bg-[#f5f1fb] border border-purple-200/90 text-[#160c28] placeholder-[#9a8bb0] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20'
                        : isCyber
                        ? 'bg-[#030814] border border-cyan-500/35 text-white placeholder-[#426084] focus:border-[#00f0ff] focus:ring-2 focus:ring-[#00f0ff]/30'
                        : 'bg-[#1b122c] border border-purple-500/25 text-white placeholder-[#686282] focus:border-[#e02b88] focus:ring-2 focus:ring-[#e02b88]/30'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors p-0.5 ${
                      isLight ? 'text-[#8c7a9e] hover:text-[#160c28]' : 'text-[#7d7798] hover:text-white'
                    }`}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Register Mode only) */}
              {mode === 'register' && (
                <div>
                  <label
                    className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                      isLight ? 'text-[#6d5e82]' : isCyber ? 'text-[#82a0c4]' : 'text-[#9f92b4]'
                    }`}
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                        isLight ? 'text-[#8c7a9e]' : isCyber ? 'text-[#3b668f]' : 'text-[#7d7798]'
                      }`}
                    />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full rounded-xl pl-10 pr-11 py-3 text-sm transition-all font-sans focus:outline-none ${
                        isLight
                          ? 'bg-[#f5f1fb] border border-purple-200/90 text-[#160c28] placeholder-[#9a8bb0] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20'
                          : isCyber
                          ? 'bg-[#030814] border border-cyan-500/35 text-white placeholder-[#426084] focus:border-[#00f0ff] focus:ring-2 focus:ring-[#00f0ff]/30'
                          : 'bg-[#1b122c] border border-purple-500/25 text-white placeholder-[#686282] focus:border-[#e02b88] focus:ring-2 focus:ring-[#e02b88]/30'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors p-0.5 ${
                        isLight ? 'text-[#8c7a9e] hover:text-[#160c28]' : 'text-[#7d7798] hover:text-white'
                      }`}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Forgot Password Option (Login Mode only) */}
              {mode === 'login' && (
                <div className="flex items-center justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotNotice('');
                      setForgotModalOpen(true);
                    }}
                    className={`text-xs font-semibold transition-colors ${
                      isLight
                        ? 'text-[#7c3aed] hover:text-[#5b21b6]'
                        : isCyber
                        ? 'text-cyan-400 hover:text-cyan-300'
                        : 'text-pink-400 hover:text-pink-300'
                    }`}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-2 py-3.5 px-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg ${
                  isCyber
                    ? 'bg-gradient-to-r from-[#00b4d8] via-[#0077b6] to-[#7928ca] hover:from-[#00c4ea] hover:to-[#8a38db] shadow-cyan-500/30 hover:shadow-cyan-500/50'
                    : 'bg-gradient-to-r from-[#e02b88] via-[#a855f7] to-[#7c3aed] hover:from-[#d01c78] hover:to-[#6d28d9] shadow-pink-600/35 hover:shadow-pink-600/50'
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{mode === 'register' ? 'Creating Account...' : 'Signing in...'}</span>
                  </div>
                ) : (
                  <>
                    <span>{mode === 'register' ? 'Create Free Account' : 'Sign In to PlayX'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Banner */}
            <div
              className={`pt-3 text-center border-t space-y-2.5 ${
                isLight ? 'border-purple-200/60' : isCyber ? 'border-cyan-500/20' : 'border-purple-500/15'
              }`}
            >
              {mode === 'login' ? (
                <>
                  <p
                    className={`text-[11px] font-medium flex items-center justify-center gap-1 ${
                      isLight ? 'text-[#8c7a9e]' : isCyber ? 'text-cyan-300/70' : 'text-purple-300/70'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-pink-400" />
                    <span>Quick Demo Sign-In (Click to auto-fill):</span>
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('saran@gmail.com');
                        setPassword('Saran@123');
                      }}
                      className={`px-3 py-1 rounded-lg transition-all font-medium ${
                        isLight
                          ? 'bg-[#f0e8fa] hover:bg-[#e6d9f7] border border-purple-200 text-[#6d28d9]'
                          : isCyber
                          ? 'bg-[#02182b]/90 hover:bg-[#032a4d] border border-cyan-500/40 text-cyan-300'
                          : 'bg-[#1f1433] hover:bg-[#2c1c49] border border-pink-500/25 text-pink-300'
                      }`}
                    >
                      saran@gmail.com
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('user@example.com');
                        setPassword('UserPass123');
                      }}
                      className={`px-3 py-1 rounded-lg transition-all font-medium ${
                        isLight
                          ? 'bg-[#f0e8fa] hover:bg-[#e6d9f7] border border-purple-200 text-[#6d28d9]'
                          : isCyber
                          ? 'bg-[#02182b]/90 hover:bg-[#032a4d] border border-cyan-500/40 text-cyan-300'
                          : 'bg-[#1f1433] hover:bg-[#2c1c49] border border-pink-500/25 text-purple-200'
                      }`}
                    >
                      Demo Listener
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('admin@example.com');
                        setPassword('AdminPass123');
                      }}
                      className={`px-3 py-1 rounded-lg transition-all font-medium ${
                        isLight
                          ? 'bg-[#f0e8fa] hover:bg-[#e6d9f7] border border-purple-200 text-[#6d28d9]'
                          : isCyber
                          ? 'bg-[#02182b]/90 hover:bg-[#032a4d] border border-cyan-500/40 text-cyan-300'
                          : 'bg-[#1f1433] hover:bg-[#2c1c49] border border-pink-500/25 text-purple-200'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </>
              ) : (
                <p className={`text-xs ${isLight ? 'text-[#6d5e82]' : isCyber ? 'text-[#82a0c4]' : 'text-[#9f92b4]'}`}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`font-bold transition-colors ml-1 ${
                      isLight
                        ? 'text-[#7c3aed] hover:text-[#5b21b6]'
                        : isCyber
                        ? 'text-[#00f0ff] hover:text-white'
                        : 'text-pink-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-4 text-left border ${
              isLight
                ? 'bg-white border-purple-200 text-[#160c28]'
                : isCyber
                ? 'bg-[#060f22] border-cyan-500/40 text-white'
                : 'bg-[#1a102b] border-pink-500/30 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`font-display text-xl font-bold ${isLight ? 'text-[#160c28]' : 'text-white'}`}>
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className={`p-1 rounded-lg transition-colors ${
                  isLight ? 'text-gray-400 hover:text-black' : 'text-gray-400 hover:text-white'
                }`}
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-xs ${isLight ? 'text-[#6d5e82]' : isCyber ? 'text-[#82a0c4]' : 'text-[#9f92b4]'}`}>
              Enter your registered PlayX email address and we'll send you instructions to reset your password.
            </p>

            {forgotNotice && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  isCyber
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200'
                    : 'bg-pink-500/20 border border-pink-500/40 text-pink-200'
                }`}
              >
                {forgotNotice}
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label
                  className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                    isLight ? 'text-[#6d5e82]' : isCyber ? 'text-[#82a0c4]' : 'text-[#9f92b4]'
                  }`}
                >
                  Registered Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm transition-all focus:outline-none ${
                    isLight
                      ? 'bg-[#f5f1fb] border border-purple-200 text-[#160c28] placeholder-[#9a8bb0] focus:border-[#7c3aed]'
                      : isCyber
                      ? 'bg-[#030814] border border-cyan-500/40 text-white placeholder-[#426084] focus:border-[#00f0ff]'
                      : 'bg-[#25173e] border border-purple-500/30 text-white placeholder-[#686282] focus:border-[#e02b88]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isLight ? 'text-[#6d5e82] hover:text-black' : 'text-[#9f92b4] hover:text-white'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-lg ${
                    isCyber
                      ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
                      : 'bg-gradient-to-r from-[#e02b88] to-[#9d4edd] hover:opacity-90 shadow-pink-600/35'
                  }`}
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
