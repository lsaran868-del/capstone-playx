import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Shield,
  Crown,
  Key,
  Save,
  LogOut,
  Sun,
  Moon,
  Zap,
  Check,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Heart,
  ListMusic,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, AVAILABLE_THEMES } from '../context/ThemeContext';

// Collection of preset avatars for quick one-click selection
const AVATAR_PRESETS = [
  { name: 'Neon Beat', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80' },
  { name: 'Cyber Wave', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80' },
  { name: 'Synth Head', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80' },
  { name: 'Bass DJ', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80' },
  { name: 'Pixel Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix' },
  { name: 'Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Midnight' },
  { name: 'Anime Flow', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Aria' },
  { name: 'Funky Vibe', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Groove' },
];

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, uploadAvatar, logout } = useAuth();
  const { theme, setTheme, isDark, isLight, isCyber } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI status states
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Sync state if user changes in context
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  // Handle local image file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate client-side
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file (JPEG, PNG, WEBP, GIF).' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size exceeds 10MB limit. Please choose a smaller image.' });
      return;
    }

    setUploadingImage(true);
    setMessage(null);

    try {
      const uploadedUrl = await uploadAvatar(file);
      setAvatar(uploadedUrl);
      setMessage({ type: 'success', text: 'Image uploaded successfully! Click "Save Changes" to apply.' });
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      const errMsg = err?.response?.data?.error || 'Failed to upload image. Please try again.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setUploadingImage(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Reset to default dicebear avatar based on name
  const handleResetAvatar = () => {
    const defaultUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'PlayX')}`;
    setAvatar(defaultUrl);
    setMessage({ type: 'success', text: 'Avatar reset to default generated style.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Display Name cannot be empty.' });
      return;
    }

    if (password) {
      if (password.length < 6) {
        setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
        return;
      }
      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        avatar: avatar.trim(),
        password: password || undefined,
        bio: user?.role === 'artist' ? bio.trim() : undefined,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.error || 'Failed to update profile. Please try again.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setSaving(false);
    }
  };

  const currentAvatar = avatar || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80';

  return (
    <div className="p-4 sm:p-8 space-y-8 pb-28 select-none max-w-4xl mx-auto">
      {/* Header Banner & Live Profile Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/40 via-pink-900/20 to-black p-6 sm:p-8 border border-pink-500/30 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar with Interactive Upload Trigger */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative group cursor-pointer transition-all duration-300 ${
              isDragOver ? 'scale-105 ring-4 ring-pink-500' : ''
            }`}
            onClick={() => fileInputRef.current?.click()}
            title="Click or drag an image here to upload new photo"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-pink-500/60 shadow-2xl shadow-pink-500/20 bg-black/60 relative">
              <img
                src={currentAvatar}
                alt={name || user?.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'PlayX')}`;
                }}
              />

              {/* Uploading Overlay */}
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
                  <RefreshCw className="w-6 h-6 animate-spin text-pink-400 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Uploading...</span>
                </div>
              )}

              {/* Hover Camera Overlay */}
              {!uploadingImage && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <Camera className="w-7 h-7 text-pink-400 mb-1 drop-shadow" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Change Photo</span>
                </div>
              )}
            </div>

            {/* Quick Upload Badge Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="absolute bottom-1 right-1 p-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:scale-110 active:scale-95 transition-transform"
              title="Upload Photo"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>

          {/* User Details & Live Display */}
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] uppercase font-black bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {user?.role || 'user'} account
              </span>
              <span className="px-3 py-0.5 rounded-full text-[10px] uppercase font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Crown className="w-3 h-3" />
                {user?.subscription || 'Free Plan'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {name || user?.name || 'PlayX User'}
            </h1>
            <p className="text-xs text-white/60 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-pink-400" />
              <span>{user?.email}</span>
            </p>

            {/* Stats row */}
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-4 text-xs text-white/70">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <strong>{user?.stats?.favoritesCount ?? 0}</strong> Liked Songs
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
                <ListMusic className="w-3.5 h-3.5 text-purple-400" />
                <strong>{user?.stats?.playlistsCount ?? 0}</strong> Playlists
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* Feedback Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-fadeIn border ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="flex-1">{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-white/40 hover:text-white text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Avatar Presets & Custom URL Section */}
      <div className="glass-panel p-6 rounded-3xl border border-muse-border/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Choose an Avatar or Upload Your Own</span>
            </h3>
            <p className="text-[11px] text-muse-subtext">
              Upload an image from your computer, choose a stylized preset, or paste a link.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="px-3.5 py-1.5 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetAvatar}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors"
              title="Reset avatar to default"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-4 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer text-center flex flex-col items-center justify-center gap-1.5 ${
            isDragOver
              ? 'border-pink-500 bg-pink-500/10 scale-[1.01]'
              : 'border-white/15 bg-white/[0.02] hover:border-pink-500/40 hover:bg-white/[0.04]'
          }`}
        >
          <Camera className="w-6 h-6 text-pink-400/80" />
          <p className="text-xs font-semibold text-white">
            Drag and drop your image here, or <span className="text-pink-400 underline">browse files</span>
          </p>
          <p className="text-[10px] text-muse-subtext">Supports PNG, JPG, WebP, GIF (Max 10MB)</p>
        </div>

        {/* Presets Gallery */}
        <div className="space-y-2 pt-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muse-subtext">
            Quick Avatar Presets
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
            {AVATAR_PRESETS.map((preset, idx) => {
              const isSelected = avatar === preset.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(preset.url)}
                  className={`group relative rounded-2xl p-1 border transition-all flex flex-col items-center ${
                    isSelected
                      ? 'border-pink-500 bg-pink-500/20 scale-105 shadow-md shadow-pink-500/30'
                      : 'border-white/10 bg-black/40 hover:border-white/30 hover:scale-102'
                  }`}
                  title={preset.name}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/60 relative">
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-pink-500/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-semibold text-white/70 truncate w-full text-center mt-1">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom URL Accordion */}
        <div className="pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{showUrlInput ? 'Hide Image URL input' : 'Or paste a direct image URL'}</span>
          </button>

          {showUrlInput && (
            <div className="mt-3 flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/your-avatar.jpg"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
              />
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Profile Settings Form */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-muse-border/40 shadow-2xl space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-pink-500" />
            <span>Account Details</span>
          </h2>
          <p className="text-xs text-muse-subtext">Update your personal information and preferences.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-2">
              Display Name <span className="text-pink-400">*</span>
            </label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name or Nickname"
                className="w-full bg-black/60 border border-white/15 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors shadow-inner"
              />
            </div>
            <p className="text-[11px] text-white/40 mt-1">This is how your name appears to other listeners and on playlists.</p>
          </div>

          {/* Email Address (Read-only) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-24 py-3 text-sm text-white/60 cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Verified
              </span>
            </div>
            <p className="text-[11px] text-white/40 mt-1">Email is associated with your login credentials.</p>
          </div>

          {/* Artist Bio (only if role === 'artist') */}
          {user?.role === 'artist' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-2">
                Artist Bio & Description
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-3 w-4 h-4 text-white/40" />
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short bio about your music, style, and inspirations..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors shadow-inner"
                />
              </div>
            </div>
          )}

          {/* Password Update Section */}
          <div className="pt-4 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-pink-400" />
                  <span>Change Password</span>
                </h4>
                <p className="text-[11px] text-muse-subtext">Leave blank if you do not wish to change your password.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-white/60 hover:text-white flex items-center gap-1 font-semibold"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-1.5">
                  New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-black/60 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-white/15 focus:border-pink-500'
                  }`}
                />
              </div>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3 h-3" /> Passwords do not match
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </form>
      </div>

      {/* Theme & Appearance Section */}
      <div className="glass-panel p-6 rounded-3xl border border-muse-border/40 shadow-2xl space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {isLight ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : isCyber ? (
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400" />
            ) : (
              <Moon className="w-5 h-5 text-purple-400" />
            )}
            <span>Theme & Appearance</span>
          </h3>
          <p className="text-xs text-muse-subtext">
            Choose your preferred interface theme. Selected theme applies to the entire app and player.
          </p>
        </div>

        {/* 3 Interactive Theme Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {AVAILABLE_THEMES.map((item) => {
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id)}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  isSelected
                    ? item.id === 'cyber'
                      ? 'bg-[#031d36]/80 border-cyan-400 shadow-lg shadow-cyan-500/20'
                      : item.id === 'light'
                      ? 'bg-purple-100/90 border-purple-400 shadow-lg shadow-purple-500/10'
                      : 'bg-purple-950/60 border-pink-500 shadow-lg shadow-pink-500/20'
                    : 'bg-muse-dark/50 border-muse-border/40 hover:bg-muse-hover/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      item.id === 'cyber'
                        ? 'bg-cyan-950 border border-cyan-500/40 text-cyan-300'
                        : item.id === 'light'
                        ? 'bg-amber-100 border border-amber-300 text-amber-600'
                        : 'bg-purple-900 border border-purple-500/40 text-purple-300'
                    }`}
                  >
                    {item.id === 'cyber' ? (
                      <Zap className="w-4 h-4 fill-cyan-300" />
                    ) : item.id === 'light' ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[11px] font-bold shadow">
                      ✓
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white">{item.name}</h4>
                <p className="text-[11px] text-muse-subtext mt-0.5">{item.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
