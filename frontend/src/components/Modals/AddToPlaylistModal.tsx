import React, { useEffect, useState } from 'react';
import { X, Plus, Check, Music, Loader2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { Playlist, Song } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AddToPlaylistModalProps {
  songId: string;
  onClose: () => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ songId, onClose }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [inPlaylistMap, setInPlaylistMap] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        const res = await api.get('/playlists');
        const all: Playlist[] = res.data || [];
        const myPlaylists = all.filter(
          (pl) => pl.userId === user?.id || pl.user_id === user?.id || user?.role === 'admin'
        );
        setPlaylists(myPlaylists);

        // Check if songId exists in any of these playlists
        const statusMap: { [key: string]: boolean } = {};
        await Promise.all(
          myPlaylists.map(async (pl) => {
            try {
              const plRes = await api.get(`/playlists/${pl.id}`);
              const songs: Song[] = plRes.data.songs || [];
              if (songs.some((s) => s.id === songId)) {
                statusMap[pl.id] = true;
              }
            } catch (err) {
              // ignore
            }
          })
        );
        setInPlaylistMap(statusMap);
      } catch (err) {
        console.error('Failed to load playlists in modal:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, [user, songId]);

  const handleAdd = async (playlistId: string) => {
    setActionId(playlistId);
    try {
      await api.post(`/playlists/${playlistId}/songs`, { song_id: songId });
      setInPlaylistMap((prev) => ({ ...prev, [playlistId]: true }));
    } catch (err) {
      console.error('Failed to add song to playlist:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleRemove = async (playlistId: string) => {
    setActionId(playlistId);
    try {
      await api.delete(`/playlists/${playlistId}/songs/${songId}`);
      setInPlaylistMap((prev) => ({ ...prev, [playlistId]: false }));
    } catch (err) {
      console.error('Failed to remove song from playlist:', err);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-muse-card border border-muse-border/60 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-muse-subtext hover:text-white hover:bg-muse-hover transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-lg font-black text-white">Add / Remove in Playlists</h3>
          <p className="text-xs text-muse-subtext mt-0.5">Manage which of your playlists include this song</p>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <Music className="w-8 h-8 mx-auto text-muse-subtext/40" />
              <p className="text-xs text-muse-subtext">No playlists found. Create one in your Library first!</p>
            </div>
          ) : (
            playlists.map((pl) => {
              const isAdded = inPlaylistMap[pl.id];
              const isBusy = actionId === pl.id;

              return (
                <div
                  key={pl.id}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-muse-dark/60 hover:bg-muse-hover border border-muse-border/30 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={pl.coverArt || pl.cover_art || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=100&q=80'}
                      alt={pl.name}
                      className="w-10 h-10 rounded-lg object-cover border border-muse-border/40 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate group-hover:text-pink-400 transition-colors">
                        {pl.name}
                      </h4>
                      <p className="text-[11px] text-muse-subtext">
                        {pl.is_public !== false ? 'Public' : 'Private'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2 flex items-center gap-2">
                    {isBusy ? (
                      <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
                    ) : isAdded ? (
                      <>
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none">
                          <Check className="w-3 h-3" /> In Playlist
                        </span>
                        <button
                          onClick={() => handleRemove(pl.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Remove from this playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleAdd(pl.id)}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        title="Add to this playlist"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
