import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';

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

const AppContent: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex h-screen bg-muse-dark text-white overflow-hidden font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <main className="flex-1 overflow-y-auto bg-muse-radial">
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </main>

        {/* Global Persistent Bottom Audio Player */}
        <Player />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
