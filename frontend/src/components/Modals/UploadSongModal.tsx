import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Music, Image, CheckCircle, AlertCircle, Disc, User, Sparkles, Clock } from 'lucide-react';
import api from '../../services/api';
import { Artist, Album, Genre } from '../../types';

interface UploadSongModalProps {
  onClose: () => void;
  onUploaded: () => void;
}

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const UploadSongModal: React.FC<UploadSongModalProps> = ({ onClose, onUploaded }) => {
  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [detectedDuration, setDetectedDuration] = useState<number>(180);
  const [isDetectingDuration, setIsDetectingDuration] = useState<boolean>(false);

  // Cover image state
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Metadata state
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [albumTitle, setAlbumTitle] = useState('');
  const [genreName, setGenreName] = useState('Pop');

  // Existing suggestions from API
  const [existingArtists, setExistingArtists] = useState<Artist[]>([]);
  const [existingAlbums, setExistingAlbums] = useState<Album[]>([]);
  const [existingGenres, setExistingGenres] = useState<Genre[]>([]);

  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch suggestions to make selecting artist/album/genre quick & seamless
    const loadSuggestions = async () => {
      try {
        const [artistsRes, albumsRes, genresRes] = await Promise.allSettled([
          api.get('/artists'),
          api.get('/albums'),
          api.get('/genres')
        ]);
        if (artistsRes.status === 'fulfilled' && Array.isArray(artistsRes.value.data)) {
          setExistingArtists(artistsRes.value.data);
        }
        if (albumsRes.status === 'fulfilled' && Array.isArray(albumsRes.value.data)) {
          setExistingAlbums(albumsRes.value.data);
        }
        if (genresRes.status === 'fulfilled' && Array.isArray(genresRes.value.data)) {
          setExistingGenres(genresRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load metadata options:', err);
      }
    };
    loadSuggestions();
  }, []);

  const handleAudioSelect = (file: File) => {
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt && !file.type.startsWith('audio/')) {
      setErrorMsg('Please select a valid audio file (MP3, WAV, M4A, or OGG).');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('Audio file size exceeds 50MB limit.');
      return;
    }

    setAudioFile(file);

    // Auto-prefill song title if empty
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Auto-detect duration using browser Audio API
    setIsDetectingDuration(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      const tempAudio = new Audio(objectUrl);
      tempAudio.addEventListener('loadedmetadata', () => {
        const dur = Math.round(tempAudio.duration);
        if (dur > 0) {
          setDetectedDuration(dur);
        }
        setIsDetectingDuration(false);
        URL.revokeObjectURL(objectUrl);
      });
      tempAudio.addEventListener('error', () => {
        setIsDetectingDuration(false);
        URL.revokeObjectURL(objectUrl);
      });
    } catch (e) {
      setIsDetectingDuration(false);
    }
  };

  const handleCoverSelect = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Cover image exceeds 10MB limit.');
      return;
    }

    setCoverFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  };

  const handleRemoveCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setErrorMsg('Please select an audio file to upload.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Please enter a song title.');
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('audioFile', audioFile);
      if (coverFile) {
        formData.append('coverFile', coverFile);
      }
      formData.append('title', title.trim());
      formData.append('artist', artistName.trim() || 'PlayX Artist');
      if (albumTitle.trim()) {
        formData.append('album', albumTitle.trim());
      }
      if (genreName.trim()) {
        formData.append('genre', genreName.trim());
      }
      formData.append('duration', detectedDuration.toString());

      await api.post('/songs/upload', formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        }
      });

      setSuccessMsg(`"${title}" uploaded and stored successfully!`);
      setTimeout(() => {
        onUploaded();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Song upload error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to upload song. Please try again.';
      setErrorMsg(msg);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none overflow-y-auto">
      <div className="glass-panel border border-pink-500/30 rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isUploading}
          className="absolute right-5 top-5 text-muse-subtext hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6 border-b border-muse-border/30 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 shrink-0">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Upload Local Music
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                Admin Storage
              </span>
            </h2>
            <p className="text-xs text-muse-subtext mt-0.5">
              Select a music file from your computer to store and play directly inside PLAYX
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* 1. Audio File Picker & Dropzone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-2">
              Audio File <span className="text-pink-400">*</span>
            </label>

            <input
              ref={audioInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,.ogg,.flac,audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAudioSelect(file);
              }}
            />

            {audioFile ? (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-muse-card border border-pink-500/40 shadow-inner">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 border border-pink-500/30">
                    <Music className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{audioFile.name}</h4>
                    <div className="flex items-center gap-3 text-[11px] text-muse-subtext mt-0.5">
                      <span>{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-pink-300 font-semibold">
                        <Clock className="w-3 h-3" />
                        {isDetectingDuration ? 'Detecting...' : `${formatDuration(detectedDuration)} detected`}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all shrink-0 ml-3"
                >
                  Replace
                </button>
              </div>
            ) : (
              <div
                onClick={() => audioInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleAudioSelect(file);
                }}
                className="cursor-pointer border-2 border-dashed border-muse-border/60 hover:border-pink-500 rounded-2xl p-6 text-center bg-muse-dark/40 hover:bg-muse-hover/20 transition-all flex flex-col items-center justify-center gap-2.5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 group-hover:scale-110 transition-transform flex items-center justify-center shadow-lg shadow-pink-500/10">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block group-hover:text-pink-300 transition-colors">
                    Click to browse or drop an audio file here
                  </span>
                  <span className="text-[11px] text-muse-subtext block mt-0.5">
                    Supported: MP3, WAV, M4A, OGG • Max size: 50MB
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Metadata Grid: Title & Artist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-1.5">
                Song Title <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Midnight City Lights"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-muse-dark/80 border border-muse-border/50 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/40 transition-colors placeholder:text-muse-subtext/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-1.5 flex items-center justify-between">
                <span>Artist</span>
                <span className="text-[10px] text-muse-subtext lowercase">Select or type</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="artist-suggestions"
                  placeholder="e.g. Synthwave Neo or Custom"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="w-full bg-muse-dark/80 border border-muse-border/50 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/40 transition-colors placeholder:text-muse-subtext/40"
                />
                <datalist id="artist-suggestions">
                  {existingArtists.map((a) => (
                    <option key={a.id} value={a.name} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* 3. Album & Genre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-1.5">
                Album (Optional)
              </label>
              <input
                type="text"
                list="album-suggestions"
                placeholder="e.g. Neon Horizon or Single"
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                className="w-full bg-muse-dark/80 border border-muse-border/50 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/40 transition-colors placeholder:text-muse-subtext/40"
              />
              <datalist id="album-suggestions">
                {existingAlbums.map((alb) => (
                  <option key={alb.id} value={alb.title} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-1.5">
                Genre
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="genre-suggestions"
                  placeholder="e.g. Synthwave, Pop, Lo-Fi, Rock"
                  value={genreName}
                  onChange={(e) => setGenreName(e.target.value)}
                  className="w-full bg-muse-dark/80 border border-muse-border/50 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/40 transition-colors placeholder:text-muse-subtext/40"
                />
                <datalist id="genre-suggestions">
                  <option value="Synthwave" />
                  <option value="Pop" />
                  <option value="Lo-Fi Beats" />
                  <option value="Rock" />
                  <option value="Electronic" />
                  <option value="Classical" />
                  <option value="Hip-Hop" />
                  <option value="Jazz" />
                  {existingGenres.map((g) => (
                    <option key={g.id} value={g.name} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* 4. Cover Image Picker (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-1.5">
              Cover Image (Optional)
            </label>

            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCoverSelect(file);
              }}
            />

            {coverPreview ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muse-dark/60 border border-pink-500/40">
                <div className="flex items-center gap-3">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-14 h-14 rounded-xl object-cover border border-muse-border/40 shrink-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Cover Art Attached</span>
                    <span className="text-[11px] text-muse-subtext">Will be saved to local storage</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => coverInputRef.current?.click()}
                className="cursor-pointer border border-dashed border-muse-border/50 hover:border-pink-500/60 rounded-xl p-3 text-center bg-muse-dark/30 hover:bg-muse-hover/20 transition-all flex items-center justify-center gap-2.5 text-xs text-muse-subtext hover:text-white"
              >
                <Image className="w-4 h-4 text-pink-400" />
                <span>Upload custom cover art (JPG, PNG, WEBP max 10MB)</span>
              </div>
            )}
          </div>

          {/* 5. Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-2 p-4 rounded-2xl bg-pink-500/10 border border-pink-500/30 animate-pulse">
              <div className="flex items-center justify-between text-xs font-bold text-pink-300">
                <span>Uploading audio & saving metadata to MySQL...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-muse-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-muse-border/30">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-full border border-muse-border/50 text-xs font-bold text-muse-subtext hover:text-white hover:bg-muse-hover transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !audioFile}
              className="px-7 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-pink-500/30 disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? `Uploading (${uploadProgress}%)` : 'Upload Song'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadSongModal;
