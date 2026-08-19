import React, { useEffect, useState } from 'react';
import { History, Play, Music } from 'lucide-react';
import api from '../services/api';
import { Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import SongRow from '../components/SongRow';

const RecentlyPlayedPage: React.FC = () => {
  const [history, setHistory] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const { playSong } = usePlayer();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/history');
        setHistory(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 pb-20 select-none">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white">Recently Played</h1>
          <p className="text-xs text-spotify-subtext">Track your listening activity automatically across sessions.</p>
        </div>
      </div>

      {history.length > 0 && (
        <button
          onClick={() => playSong(history[0], history)}
          className="px-6 py-3 rounded-full bg-spotify-green text-black font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-spotify-green/20"
        >
          <Play className="w-4 h-4 fill-black" />
          <span>Play All Recent</span>
        </button>
      )}

      <div className="bg-spotify-card/40 rounded-2xl border border-spotify-hover/40 p-4 divide-y divide-spotify-hover/30">
        {history.length > 0 ? (
          history.map((song, i) => (
            <SongRow key={`${song.id}-${i}`} song={song} index={i} queue={history} />
          ))
        ) : (
          <div className="py-16 text-center text-spotify-subtext">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-bold text-white mb-1">No listening history yet</h3>
            <p className="text-xs">Start playing music and your recently played tracks will show up here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentlyPlayedPage;
