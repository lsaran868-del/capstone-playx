import React, { useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, User, LogOut, Crown, Music, Sun, Moon, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ searchQuery = '', onSearchChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark, isLight, isCyber, themeName } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isSearchPage = location.pathname === '/search';

  return (
    <header className="h-16 px-8 flex items-center justify-between sticky top-0 z-30 glass-nav border-b border-muse-border/30">
      {/* Search Input & Navigation Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-muse-dark/80 border border-muse-border/40 flex items-center justify-center text-muse-subtext hover:text-white hover:bg-muse-hover transition-colors"
            title="Go Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 rounded-full bg-muse-dark/80 border border-muse-border/40 flex items-center justify-center text-muse-subtext hover:text-white hover:bg-muse-hover transition-colors"
            title="Go Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Styled Pill Search Bar */}
        <div className="relative w-72">
          <Search className="w-4 h-4 text-muse-subtext absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search songs, artists, playlists..."
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              if (onSearchChange) onSearchChange(val);
              if (val.trim()) {
                navigate(`/search?q=${encodeURIComponent(val)}`, { replace: isSearchPage });
              } else if (isSearchPage) {
                navigate('/search', { replace: true });
              }
            }}
            className="w-full bg-muse-dark/60 border border-muse-border/40 text-white text-xs rounded-full py-2 pl-9 pr-4 focus:outline-none focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/50 transition-all placeholder:text-muse-subtext/70"
          />
        </div>
      </div>

      {/* User Actions & ElevMuse Pill Stats */}
      <div className="flex items-center gap-3">
        {/* Status Badge from Screenshot: "8 Songs" */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muse-card/60 border border-muse-border/40 text-muse-subtext text-xs font-medium">
          <Music className="w-3.5 h-3.5 text-pink-400" />
          <span>8 Songs</span>
        </div>

        {/* Replay Cosmic Intro Button */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('playx:replay-intro'))}
          className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-all hover:scale-105 shadow-sm text-xs font-semibold ${
            isCyber
              ? 'bg-[#031d36]/80 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 shadow-cyan-950/40'
              : 'bg-muse-dark/80 hover:bg-muse-hover border-muse-border/50 text-purple-300 hover:text-white shadow-purple-950/40'
          }`}
          title="Replay Cosmic Black Hole Intro"
          aria-label="Replay Cosmic Intro"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">Cosmic Intro</span>
        </button>

        {/* Theme Switcher Button (Dark, Light, Cyber Neon) */}
        <button
          onClick={toggleTheme}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all hover:scale-105 shadow-sm ${
            isCyber
              ? 'bg-[#031d36]/80 border-cyan-500/50 text-cyan-300'
              : 'bg-muse-dark/80 hover:bg-muse-hover border-muse-border/50 text-muse-subtext hover:text-white'
          }`}
          title={`Theme: ${themeName} (Click to switch)`}
          aria-label="Toggle theme"
        >
          {isLight ? (
            <Sun className="w-4 h-4 text-amber-500 hover:text-amber-400 transition-colors" />
          ) : isCyber ? (
            <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400 hover:text-cyan-300 transition-colors" />
          ) : (
            <Moon className="w-4 h-4 text-purple-400 hover:text-purple-300 transition-colors" />
          )}
        </button>

        {user ? (
          <>
            {/* Plan Badge */}
            <NavLink
              to="/subscription"
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                user.subscription === 'Premium'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                  : 'bg-muse-card border border-muse-border text-muse-subtext hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{user.subscription || 'Free Plan'}</span>
            </NavLink>

            {/* Profile Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1 pl-3 rounded-full bg-muse-dark/80 hover:bg-muse-hover border border-muse-border/50 transition-colors"
              >
                <span className="font-semibold text-xs text-white max-w-[120px] truncate">{user.name}</span>
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-pink-500"
                />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-2xl py-2 z-50 border border-muse-border">
                  <div className="px-4 py-2 border-b border-muse-border/40">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-muse-subtext truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold bg-pink-500/20 text-pink-400">
                      Role: {user.role}
                    </span>
                  </div>

                  <NavLink
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-muse-subtext hover:text-white hover:bg-muse-card transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </NavLink>

                  <NavLink
                    to="/subscription"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-muse-subtext hover:text-white hover:bg-muse-card transition-colors"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Subscription Plan</span>
                  </NavLink>


                  {/* Theme Switch Option */}
                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-muse-subtext hover:text-white hover:bg-muse-card transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-purple-600" />}
                      <span>Appearance</span>
                    </div>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-pink-500/15 text-pink-400">
                      {isDark ? 'Dark' : 'Light'}
                    </span>
                  </button>

                  <div className="border-t border-muse-border/40 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                        navigate('/login', { replace: true });
                      }}
                      className="w-full text-left flex items-center gap-3 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <NavLink
              to="/register"
              className="text-xs font-bold text-muse-subtext hover:text-white transition-colors"
            >
              Sign up
            </NavLink>
            <NavLink
              to="/login"
              className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs hover:scale-105 transition-transform shadow-lg shadow-pink-500/25"
            >
              Log in
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
