import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Link as LinkIcon, CheckCircle2, AlertCircle, Sparkles, Camera } from 'lucide-react';
import api from '../../services/api';

interface EditArtistImageModalProps {
  artist: {
    id: string;
    name: string;
    image?: string;
  };
  onClose: () => void;
  onUpdated: (newImageUrl: string) => void;
}

const EditArtistImageModal: React.FC<EditArtistImageModalProps> = ({ artist, onClose, onUpdated }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(artist.image || null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt && !file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (.jpg, .jpeg, .png, .webp)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image file size exceeds 10MB limit.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrlInput(url);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (url.trim().startsWith('http://') || url.trim().startsWith('https://')) {
      setPreviewUrl(url.trim());
    } else if (!url.trim()) {
      setPreviewUrl(artist.image || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (activeTab === 'upload' && !selectedFile) {
      setErrorMessage('Please select an image file to upload.');
      return;
    }

    if (activeTab === 'url' && (!imageUrlInput.trim() || (!imageUrlInput.startsWith('http://') && !imageUrlInput.startsWith('https://')))) {
      setErrorMessage('Please provide a valid web image URL (http:// or https://).');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let response;
      if (activeTab === 'upload' && selectedFile) {
        const formData = new FormData();
        formData.append('imageFile', selectedFile);

        response = await api.put(`/admin/artists/${artist.id}/image`, formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          },
        });
      } else {
        response = await api.put(`/admin/artists/${artist.id}/image`, {
          imageUrl: imageUrlInput.trim(),
        });
      }

      const newUrl = response.data.imageUrl;
      setSuccessMessage('Artist image updated successfully!');
      setTimeout(() => {
        onUpdated(newUrl);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to update artist image:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to update image. Ensure you are an Admin.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#140b22] border border-pink-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/50 via-pink-950/30 to-[#140b22]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">Update Artist Photo</h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-muse-subtext truncate max-w-[260px]">
                Modifying avatar for <span className="text-white font-semibold">{artist.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {/* Status Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Current & Live Circular Avatar Preview */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pink-500/60 shadow-xl shadow-pink-500/20 bg-muse-card/60 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Artist preview"
                    className="w-full h-full object-cover"
                    onError={() => setErrorMessage('Unable to load image from given source.')}
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-white/30" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
              </div>
            </div>
            <p className="text-[11px] text-muse-subtext font-medium text-center">
              Circular Preview as shown across PLAYX
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-black/40 border border-white/10 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Local File</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'url'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Direct Image URL</span>
            </button>
          </div>

          {/* Upload File Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-pink-500 bg-pink-500/10 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-white/15 hover:border-pink-500/40 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-pink-400" />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[280px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-emerald-400 mt-1">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to save
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-white">Click or drag an image here</p>
                    <p className="text-[10px] text-muse-subtext mt-1">
                      Supports JPG, PNG, WEBP (Max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Direct URL Tab */}
          {activeTab === 'url' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">Image URL</label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrlInput}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-all pl-9"
                />
                <LinkIcon className="w-4 h-4 text-white/40 absolute left-3 top-3" />
              </div>
              <p className="text-[10px] text-muse-subtext">
                Enter any valid web image link. A preview will appear above.
              </p>
            </div>
          )}

          {/* Progress indicator during upload */}
          {isSubmitting && activeTab === 'upload' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-muse-subtext">
                <span>Uploading image to server...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-pink-500 to-purple-600 h-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (activeTab === 'upload' && !selectedFile) || (activeTab === 'url' && !imageUrlInput.trim())}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${
                isSubmitting || (activeTab === 'upload' && !selectedFile) || (activeTab === 'url' && !imageUrlInput.trim())
                  ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-105 active:scale-95 shadow-pink-500/25'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Artist Image</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditArtistImageModal;
