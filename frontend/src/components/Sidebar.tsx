import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Library, 
  Sparkles, 
  Sliders, 
  Wrench, 
  Mic2, 
  Smartphone, 
  MessageSquare, 
  PlusSquare, 
  Heart, 
  History, 
  ShieldCheck, 
  Crown,
  PanelLeftClose,
  LogOut,
  Sun,
  Moon,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { Playlist } from '../types';
import CreatePlaylistModal from './Modals/CreatePlaylistModal';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark, isLight, isCyber, themeName } = useTheme();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchPlaylists = async () => {
    try {
      const res = await api.get('/playlists');
      setPlaylists(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [user]);

  return (
    <aside className="w-64 bg-muse-dark flex flex-col h-full border-r border-muse-border/40 p-4 select-none shrink-0 relative z-20">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-2 py-3 mb-4">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:scale-105 transition-transform">
            <span className="font-black text-white text-base">X</span>
          </div>
          <span className="font-display font-black text-xl tracking-wider text-white flex items-center gap-0.5">
            PLAY<span className="text-pink-500">X</span>
          </span>
        </NavLink>
        <button className="text-muse-subtext hover:text-white transition-colors p-1 rounded-md">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {/* Active Pill Home */}
        <div className="space-y-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-pink-600/40 via-purple-600/30 to-pink-500/10 border border-pink-500/40 text-white shadow-lg shadow-pink-500/10'
                  : 'text-muse-subtext hover:text-white hover:bg-muse-hover/40'
              }`
            }
          >
            <div className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Home className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
            </div>
            <span>Home</span>
          </NavLink>
        </div>

        {/* Discover Section */}
        <div className="space-y-1">
          <h3 className="px-3 text-[11px] font-semibold text-muse-subtext/70 uppercase tracking-wider mb-2">
            Discover
          </h3>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'text-white bg-muse-hover/60' : 'text-muse-subtext hover:text-white hover:bg-muse-hover/30'
              }`
            }
          >
            <Compass className="w-4 h-4 text-muse-subtext" />
            <span>Explore</span>
          </NavLink>
          <NavLink
            to="/library"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'text-white bg-muse-hover/60' : 'text-muse-subtext hover:text-white hover:bg-muse-hover/30'
              }`
            }
          >
            <Library className="w-4 h-4 text-muse-subtext" />
            <span>Library</span>
          </NavLink>
        </div>

        {/* Create Section */}
        <div className="space-y-1">
          <h3 className="px-3 text-[11px] font-semibold text-muse-subtext/70 uppercase tracking-wider mb-2">
            Create
          </h3>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-muse-subtext hover:text-white hover:bg-muse-hover/30 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Studio</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/search')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-muse-subtext hover:text-white hover:bg-muse-hover/30 transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <Sliders className="w-4 h-4 text-muse-subtext" />
              <span>Styles</span>
            </div>
            <span className="text-xs text-muse-subtext group-hover:text-pink-400 transition-colors">+</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-sm font-medium text-muse-subtext hover:text-white hover:bg-muse-hover/30 transition-colors"
          >
            <Wrench className="w-4 h-4 text-muse-subtext" />
            <span>Tools</span>
          </button>

          <button
            onClick={() => navigate('/library')}
            className="w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-sm font-medium text-muse-subtext hover:text-white hover:bg-muse-hover/30 transition-colors"
          >
            <Mic2 className="w-4 h-4 text-muse-subtext" />
            <span>Artist</span>
          </button>
        </div>

        {/* Quick Collections & Playlists */}
        <div className="space-y-1 border-t border-muse-border/30 pt-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-pink-400 hover:bg-pink-500/10 transition-colors"
          >
            <PlusSquare className="w-4 h-4" />
            <span>New Playlist</span>
          </button>
          <NavLink
            to="/favorites"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                isActive ? 'text-white bg-muse-hover/60' : 'text-muse-subtext hover:text-white hover:bg-muse-hover/30'
              }`
            }
          >
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500/40" />
            <span>Liked Songs</span>
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                isActive ? 'text-white bg-muse-hover/60' : 'text-muse-subtext hover:text-white hover:bg-muse-hover/30'
              }`
            }
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span>Recently Played</span>
          </NavLink>
        </div>

        {/* Dashboards if available */}
        {(user?.role === 'artist' || user?.role === 'admin') && (
          <div className="space-y-1 border-t border-muse-border/30 pt-4">
            <h3 className="px-3 text-[11px] font-semibold text-muse-subtext/70 uppercase tracking-wider mb-2">
              Management
            </h3>
            <NavLink
              to="/artist-dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive ? 'text-white bg-muse-hover/60' : 'text-muse-subtext hover:text-white hover:bg-muse-hover/30'
                }`
              }
            >
              <Mic2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Artist Portal</span>
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink
                to="/admin-dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive ? 'text-white bg-muse-hover/60' : 'text-muse-subtext hover:text-white hover:bg-muse-hover/30'
                  }`
                }
              >
                <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
                <span>Admin Panel</span>
              </NavLink>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation & Promo Card */}
      <div className="pt-3 border-t border-muse-border/30 space-y-2 shrink-0">
        <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-medium text-muse-subtext hover:text-white transition-colors">
          <Smartphone className="w-4 h-4 text-muse-subtext" />
          <span>Get on iPhone</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-medium text-muse-subtext hover:text-white transition-colors">
          <MessageSquare className="w-4 h-4 text-muse-subtext" />
          <span>Feedback</span>
        </button>

        {/* Transfer Your Music Banner */}
        <div className="p-3.5 rounded-2xl bg-muse-card/80 border border-muse-border shadow-xl space-y-2 mt-2">
          <h4 className="font-bold text-xs text-white">Transfer your music</h4>
          <p className="text-[11px] text-muse-subtext leading-tight">
            Bring all your favorite playlists, artists, tracks, and albums.
          </p>
          <NavLink
            to="/subscription"
            className="w-full py-2 mt-1 rounded-full border border-amber-400/80 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-400/10 transition-all shadow-md shadow-amber-400/5 group"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Upgrade</span>
          </NavLink>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-muse-subtext hover:text-white hover:bg-muse-hover/60 transition-colors"
          title={`Theme: ${themeName} (Click to switch)`}
        >
          <div className="flex items-center gap-3">
            {isLight ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : isCyber ? (
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            ) : (
              <Moon className="w-4 h-4 text-purple-400" />
            )}
            <span className="truncate max-w-[100px]">{themeName}</span>
          </div>
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
              isCyber
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : isLight
                ? 'bg-purple-100 text-purple-700'
                : 'bg-pink-500/15 text-pink-400'
            }`}
          >
            {theme}
          </span>
        </button>

        {/* Logout Option */}
        <button
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>

      {/* Playlist Creation Modal */}
      {isModalOpen && <CreatePlaylistModal onClose={() => setIsModalOpen(false)} onCreated={fetchPlaylists} />}
    </aside>
  );
};

export default Sidebar;
