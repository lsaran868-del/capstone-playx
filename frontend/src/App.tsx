import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { ThemeProvider } from './context/ThemeContext';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Player from './components/Player';

import Home from './pages/Home';
import SearchPage from './pages/SearchPage';
import Library from './pages/Library';
import PlaylistDetails from './pages/PlaylistDetails';
import AlbumDetails from './pages/AlbumDetails';
import ArtistDetails from './pages/ArtistDetails';
import FavoritesPage from './pages/FavoritesPage';
import RecentlyPlayedPage from './pages/RecentlyPlayedPage';
import ArtistDashboard from './pages/ArtistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SubscriptionPage from './pages/SubscriptionPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import IntroScreen from './components/IntroScreen';

const AppContent: React.FC = () => {
  const { user, token, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showIntro, setShowIntro] = useState(true);

  // Global event listener for replaying the intro anytime
  useEffect(() => {
    const handleReplay = () => setShowIntro(true);
    window.addEventListener('playx:replay-intro', handleReplay);
    return () => window.removeEventListener('playx:replay-intro', handleReplay);
  }, []);

  return (
    <>
      {/* PlayX Cosmic Black Hole Intro Sequence */}
      {showIntro && (
        <IntroScreen
          onComplete={() => {
            setShowIntro(false);
          }}
        />
      )}

      {/* 1. Sleek loading screen during session verification */}
      {loading ? (
        <div className="min-h-screen bg-[#12101b] flex flex-col items-center justify-center space-y-4 select-none">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#6c5dd3] flex items-center justify-center shadow-xl shadow-purple-900/50 animate-pulse">
            <span className="font-display font-black text-white text-3xl tracking-tight">X</span>
          </div>
          <p className="font-display text-xs tracking-widest text-purple-300/80 uppercase animate-pulse">
            Loading PlayX...
          </p>
        </div>
      ) : !token || !user ? (
        /* 2. Unauthenticated state: strictly show login / register */
        <div className="animate-fade-in w-full min-h-screen">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      ) : (
        /* 3. Authenticated state: full access to music dashboard, sidebar, and player */
        <div className="flex h-screen bg-muse-dark text-white overflow-hidden font-sans">
          {/* Persistent Left Sidebar */}
          <Sidebar />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <main className="flex-1 overflow-y-auto bg-muse-radial relative">
          {/* Subtle Transparent PLAYX Background Watermark */}
          <div className="playx-bg-watermark md:pl-64 pb-20">
            <div className="playx-bg-watermark-text">
              PLAY<span className="playx-bg-watermark-accent">X</span>
            </div>
          </div>

          <div className="relative z-10 min-h-full">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/library" element={<Library />} />
              <Route path="/playlist/:id" element={<PlaylistDetails />} />
              <Route path="/album/:id" element={<AlbumDetails />} />
              <Route path="/artist/:id" element={<ArtistDetails />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/history" element={<RecentlyPlayedPage />} />
              <Route path="/artist-dashboard" element={<ArtistDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              {/* Redirect auth pages to dashboard if already logged in */}
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/register" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        {/* Global Persistent Bottom Audio Player */}
        <Player />
      </div>
    </div>
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <PlayerProvider>
            <AppContent />
          </PlayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
