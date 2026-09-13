import React, { useState, useRef } from 'react';
import { X, Music, Globe, Lock, Upload, Trash2, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface CreatePlaylistModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverArt, setCoverArt] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit.');
      return;
    }

    setUploadError(null);
    setUploadingImage(true);

    const localUrl = URL.createObjectURL(file);
    setCoverPreview(localUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCoverArt(res.data.url);
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setUploadError(err.response?.data?.error || 'Failed to upload image. Please try again.');
      setCoverPreview(null);
      setCoverArt('');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCoverArt('');
    setCoverPreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await api.post('/playlists', {
        name,
        description,
        cover_art: coverArt,
        is_public: isPublic
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-panel border border-pink-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muse-subtext hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Create New Playlist</h2>
            <p className="text-xs text-muse-subtext">Curate your favorite tracks into a collection</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-1.5">
              Playlist Name <span className="text-pink-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Late Night Synth Vibes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-muse-dark/80 border border-muse-border/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/40 transition-colors placeholder:text-muse-subtext/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Give your playlist a mood or description..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-muse-dark/80 border border-muse-border/50 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/40 transition-colors resize-none placeholder:text-muse-subtext/50"
            />
          </div>

          {/* Cover Image Upload Area (Replacing URL input) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-1.5">
              Cover Image (Optional)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChange(file);
              }}
            />

            {coverPreview || coverArt ? (
              <div className="relative group rounded-2xl overflow-hidden border border-pink-500/50 bg-muse-dark/60 p-2.5 flex items-center gap-3.5">
                <img
                  src={coverPreview || coverArt}
                  alt="Playlist Cover Preview"
                  className="w-16 h-16 rounded-xl object-cover border border-muse-border/40 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">Image Uploaded</div>
                  <div className="text-[11px] text-muse-subtext">
                    {uploadingImage ? 'Uploading to server...' : 'Ready to save with playlist'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pr-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={uploadingImage}
                    className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
                    title="Remove Cover Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileChange(file);
                }}
                className="cursor-pointer border-2 border-dashed border-muse-border/60 hover:border-pink-500/60 rounded-2xl p-4 text-center bg-muse-dark/40 hover:bg-muse-hover/20 transition-all flex flex-col items-center justify-center gap-2 group"
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                    <span className="text-xs text-muse-subtext font-medium">Uploading image...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-pink-500/10 text-pink-400 group-hover:scale-110 transition-transform flex items-center justify-center">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-pink-300 transition-colors">
                        Click to upload image or drag and drop
                      </span>
                      <span className="text-[10px] text-muse-subtext">
                        Supports PNG, JPG, WEBP (Max 10MB)
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {uploadError && (
              <p className="text-[11px] text-rose-400 font-semibold mt-1.5">{uploadError}</p>
            )}
          </div>

          {/* Public vs Private Privacy Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muse-subtext mb-1.5">
              Privacy Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                  isPublic
                    ? 'border-pink-500/80 bg-pink-500/10 text-white shadow-sm'
                    : 'border-muse-border/40 bg-muse-dark/60 text-muse-subtext hover:text-white'
                }`}
              >
                <Globe className={`w-4 h-4 ${isPublic ? 'text-pink-400' : 'text-muse-subtext'}`} />
                <div>
                  <div className="text-xs font-bold">Public</div>
                  <div className="text-[10px] text-muse-subtext">Visible to everyone</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                  !isPublic
                    ? 'border-pink-500/80 bg-pink-500/10 text-white shadow-sm'
                    : 'border-muse-border/40 bg-muse-dark/60 text-muse-subtext hover:text-white'
                }`}
              >
                <Lock className={`w-4 h-4 ${!isPublic ? 'text-pink-400' : 'text-muse-subtext'}`} />
                <div>
                  <div className="text-xs font-bold">Private</div>
                  <div className="text-[10px] text-muse-subtext">Only you can view</div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-muse-border/20">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-muse-border/50 text-xs font-semibold text-muse-subtext hover:text-white hover:bg-muse-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs hover:scale-105 transition-transform shadow-lg shadow-pink-500/30 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlaylistModal;
