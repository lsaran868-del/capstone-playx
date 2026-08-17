import React, { useState } from 'react';
import { X, Music } from 'lucide-react';
import api from '../../services/api';

interface CreatePlaylistModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverArt, setCoverArt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await api.post('/playlists', { name, description, cover_art: coverArt });
      onCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-spotify-card border border-spotify-hover rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-spotify-subtext hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-spotify-green/20 text-spotify-green flex items-center justify-center">
            <Music className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Create Playlist</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-spotify-subtext mb-1">Playlist Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Midnight Vibes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/60 border border-spotify-hover rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-spotify-green transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-spotify-subtext mb-1">Description</label>
            <textarea
              placeholder="Give your playlist a description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/60 border border-spotify-hover rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-spotify-green transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-spotify-subtext mb-1">Cover Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={coverArt}
              onChange={(e) => setCoverArt(e.target.value)}
              className="w-full bg-black/60 border border-spotify-hover rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-spotify-green transition-colors"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-spotify-hover text-xs font-bold text-spotify-subtext hover:text-white hover:bg-spotify-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-full bg-spotify-green text-black font-bold text-xs hover:scale-105 transition-transform shadow-lg shadow-spotify-green/20"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlaylistModal;
