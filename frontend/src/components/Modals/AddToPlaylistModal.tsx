import React, { useEffect, useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import api from '../../services/api';
import { Playlist } from '../../types';

interface AddToPlaylistModalProps {
  songId: string;
  onClose: () => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ songId, onClose }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await api.get('/playlists');
        setPlaylists(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlaylists();
  }, []);

  const handleAdd = async (playlistId: string) => {
    try {
      await api.post(`/playlists/${playlistId}/songs`, { song_id: songId });
      setAddedIds(prev => new Set(prev).add(playlistId));
      setTimeout(() => onClose(), 600);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-spotify-card border border-spotify-hover rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-spotify-subtext hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-4">Add to Playlist</h3>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {playlists.length === 0 ? (
            <p className="text-xs text-spotify-subtext text-center py-4">No playlists found. Create one first!</p>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleAdd(pl.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-black/40 hover:bg-spotify-hover text-left transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-sm text-white">{pl.name}</h4>
                  <p className="text-[11px] text-spotify-subtext">{pl.songs?.length || 0} songs</p>
                </div>
                {addedIds.has(pl.id) ? (
                  <Check className="w-5 h-5 text-spotify-green" />
                ) : (
                  <Plus className="w-5 h-5 text-spotify-subtext hover:text-white" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
